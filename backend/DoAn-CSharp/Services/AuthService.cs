using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ── Owner Register ──────────────────────────────────────────────
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length <= 6)
                throw new ArgumentException("Mật khẩu phải trên 6 ký tự.");

            if (await _context.Owners.AnyAsync(u => u.Username == dto.Username))
                throw new ArgumentException("Tên đăng nhập đã tồn tại.");

            if (await _context.Owners.AnyAsync(u => u.Email == dto.Email))
                throw new ArgumentException("Email đã tồn tại.");

            var owner = new Owner
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                DisplayName = dto.DisplayName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var refreshToken = GenerateRefreshToken();
            owner.RefreshToken = refreshToken;
            owner.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

            await _context.Owners.AddAsync(owner);
            await _context.SaveChangesAsync();

            var accessToken = GenerateUserJwt(owner);
            return BuildAuthResponse(owner, accessToken, refreshToken);
        }

        // ── Owner Login ─────────────────────────────────────────────────
        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // 1. Check if user is Admin
            var admin = await _context.AdminUsers
                .FirstOrDefaultAsync(a => a.Username == dto.Username);

            if (admin != null && BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash))
            {
                admin.LastLoginAt = DateTime.UtcNow;

                var adminToken = GenerateAdminJwt(admin);
                var adminRefreshToken = GenerateRefreshToken();
                var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

                admin.RefreshToken = adminRefreshToken;
                admin.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
                await _context.SaveChangesAsync();

                return new AuthResponseDto
                {
                    AccessToken = adminToken,
                    RefreshToken = adminRefreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                    Role = "admin",
                    Owner = null
                };
            }

            // 2. Fallback to Owner
            var owner = await _context.Owners
                .FirstOrDefaultAsync(u => u.Username == dto.Username || u.Email == dto.Username);

            if (owner == null || !BCrypt.Net.BCrypt.Verify(dto.Password, owner.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials.");

            if (!owner.IsPaid)
                throw new UnauthorizedAccessException("Tài khoản chưa thanh toán phí đăng ký. Vui lòng hoàn tất đóng phí.");

            if (owner.OwnerStatus != "approved")
                throw new UnauthorizedAccessException($"Tài khoản đang ở trạng thái '{owner.OwnerStatus}'.");

            var refreshToken = GenerateRefreshToken();
            owner.RefreshToken = refreshToken;
            owner.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
            owner.LastLoginAt = DateTime.UtcNow;
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var accessToken = GenerateUserJwt(owner);
            return BuildAuthResponse(owner, accessToken, refreshToken);
        }

        // ── Admin Login ────────────────────────────────────────────────
        public async Task<AdminAuthResponseDto> AdminLoginAsync(AdminLoginDto dto)
        {
            var admin = await _context.AdminUsers
                .FirstOrDefaultAsync(a => a.Username == dto.Username);

            if (admin == null || !BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash))
                throw new UnauthorizedAccessException("Invalid admin credentials.");

            admin.LastLoginAt = DateTime.UtcNow;

            var token = GenerateAdminJwt(admin);
            var refreshToken = GenerateRefreshToken();
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

            admin.RefreshToken = refreshToken;
            admin.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return new AdminAuthResponseDto
            {
                AccessToken = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                Role = "admin"
            };
        }

        // ── Refresh Token ──────────────────────────────────────────────
        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var owner = await _context.Owners
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);

            if (owner == null)
            {
                var admin = await _context.AdminUsers
                    .FirstOrDefaultAsync(a => a.RefreshToken == refreshToken && a.RefreshTokenExpiry > DateTime.UtcNow);

                if (admin == null)
                    throw new UnauthorizedAccessException("Invalid or expired refresh token.");

                var newAdminRefreshToken = GenerateRefreshToken();
                admin.RefreshToken = newAdminRefreshToken;
                admin.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
                await _context.SaveChangesAsync();

                var adminToken = GenerateAdminJwt(admin);
                var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

                return new AuthResponseDto
                {
                    AccessToken = adminToken,
                    RefreshToken = newAdminRefreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                    Role = "admin",
                    Owner = null
                };
            }

            var newRefreshToken = GenerateRefreshToken();
            owner.RefreshToken = newRefreshToken;
            owner.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var accessToken = GenerateUserJwt(owner);
            return BuildAuthResponse(owner, accessToken, newRefreshToken);
        }

        // ── Change Password ────────────────────────────────────────────
        public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var owner = await _context.Owners.FindAsync(userId)
                ?? throw new KeyNotFoundException("Owner not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, owner.PasswordHash))
                throw new UnauthorizedAccessException("Current password is incorrect.");

            owner.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // ── Update Profile ─────────────────────────────────────────────
        public async Task UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var owner = await _context.Owners.FindAsync(userId)
                ?? throw new KeyNotFoundException("Owner not found.");

            if (dto.Email != null && dto.Email.ToLowerInvariant() != owner.Email.ToLowerInvariant())
            {
                if (await _context.Owners.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != userId))
                    throw new ArgumentException("Email đã tồn tại.");
                owner.Email = dto.Email;
            }

            if (dto.DisplayName != null) owner.DisplayName = dto.DisplayName;
            if (dto.AvatarUrl != null) owner.AvatarUrl = dto.AvatarUrl;
            if (dto.DefaultLanguage != null) owner.DefaultLanguage = dto.DefaultLanguage;
            owner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<OwnerDto> GetProfileAsync(int userId)
        {
            var owner = await _context.Owners.FindAsync(userId)
                ?? throw new KeyNotFoundException("Owner not found.");

            return new OwnerDto
            {
                Id = owner.Id,
                Username = owner.Username,
                Email = owner.Email,
                DisplayName = owner.DisplayName,
                AvatarUrl = owner.AvatarUrl,
                DefaultLanguage = owner.DefaultLanguage,
                CreatedAt = owner.CreatedAt
            };
        }

        // ── Helpers ────────────────────────────────────────────────────
        private string GenerateUserJwt(Owner owner)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured.")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, owner.Id.ToString()),
                new Claim(ClaimTypes.Name, owner.Username),
                new Claim(ClaimTypes.Email, owner.Email),
                new Claim(ClaimTypes.Role, "owner")
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateAdminJwt(AdminUser admin)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured.")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
                new Claim(ClaimTypes.Name, admin.Username),
                new Claim(ClaimTypes.Role, "admin")
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes);
        }

        private AuthResponseDto BuildAuthResponse(Owner owner, string accessToken, string refreshToken)
        {
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);
            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                Role = "owner",
                Owner = new OwnerDto
                {
                    Id = owner.Id,
                    Username = owner.Username,
                    Email = owner.Email,
                    DisplayName = owner.DisplayName,
                    AvatarUrl = owner.AvatarUrl,
                    DefaultLanguage = owner.DefaultLanguage,
                    CreatedAt = owner.CreatedAt
                }
            };
        }

        public async Task PayRegistrationFeeAsync(string username, string cardNumber, string cardHolder)
        {
            var owner = await _context.Owners.FirstOrDefaultAsync(o => o.Username == username);
            if (owner == null)
                throw new KeyNotFoundException("Tài khoản đối tác không tồn tại.");

            if (owner.IsPaid)
                throw new InvalidOperationException("Tài khoản đã hoàn tất đóng phí.");

            if (string.IsNullOrWhiteSpace(cardNumber) || !cardNumber.StartsWith("4242"))
                throw new ArgumentException("Giao dịch bị từ chối. Vui lòng sử dụng thẻ test (bắt đầu bằng 4242).");

            owner.IsPaid = true;
            owner.PaidAt = DateTime.UtcNow;
            owner.OwnerStatus = "pending"; // Chuyển sang chờ duyệt sau khi thanh toán

            // Gửi thông báo đến Admin
            _context.Notifications.Add(new Notification
            {
                OwnerId = null,
                Message = $"Tài khoản đối tác mới '{owner.DisplayName}' ({owner.Username}) đã đóng phí đăng ký và đang chờ phê duyệt.",
                Type = "OwnerPending",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}

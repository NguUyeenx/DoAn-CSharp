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
            if (await _context.Owners.AnyAsync(u => u.Username == dto.Username))
                throw new InvalidOperationException("Username already exists.");

            if (await _context.Owners.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email already exists.");

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
            var owner = await _context.Owners
                .FirstOrDefaultAsync(u => u.Username == dto.Username || u.Email == dto.Username);

            if (owner == null || !BCrypt.Net.BCrypt.Verify(dto.Password, owner.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials.");

            var refreshToken = GenerateRefreshToken();
            owner.RefreshToken = refreshToken;
            owner.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
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

            var token = GenerateAdminJwt(admin);
            var refreshToken = GenerateRefreshToken();
            var expiryMinutes = _config.GetValue<int>("Jwt:ExpiryMinutes", 60);

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
                throw new UnauthorizedAccessException("Invalid or expired refresh token.");

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

            if (dto.DisplayName != null) owner.DisplayName = dto.DisplayName;
            if (dto.AvatarUrl != null) owner.AvatarUrl = dto.AvatarUrl;
            if (dto.DefaultLanguage != null) owner.DefaultLanguage = dto.DefaultLanguage;
            owner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
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

        private static AuthResponseDto BuildAuthResponse(Owner owner, string accessToken, string refreshToken)
        {
            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
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
    }
}

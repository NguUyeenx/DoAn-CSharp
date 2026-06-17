namespace DoAn_CSharp.Models.DTOs
{
    // ── Register ──────────────────────────────────────────────────────
    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    // ── Login ─────────────────────────────────────────────────────────
    public class LoginDto
    {
        public string Username { get; set; } = string.Empty; // username or email
        public string Password { get; set; } = string.Empty;
    }

    // ── Admin Login ───────────────────────────────────────────────────
    public class AdminLoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // ── Auth Response ─────────────────────────────────────────────────
    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string Role { get; set; } = string.Empty; // "admin" or "owner"
        public OwnerDto? Owner { get; set; }
    }

    public class AdminAuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    // ── Refresh Token ─────────────────────────────────────────────────
    public class RefreshTokenDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    // ── Change Password ───────────────────────────────────────────────
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    // ── Owner Profile ──────────────────────────────────────────────────
    public class OwnerDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string DefaultLanguage { get; set; } = "en";
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileDto
    {
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? DefaultLanguage { get; set; }
    }

    public class OwnerPayFeeDto
    {
        public string Username { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolder { get; set; } = string.Empty;
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ── Owner Auth ─────────────────────────────────────────────────

        /// <summary>Đăng ký tài khoản người dùng</summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(result);
        }

        /// <summary>Đăng nhập người dùng (username hoặc email)</summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }

        /// <summary>Làm mới Access Token bằng Refresh Token</summary>
        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
            return Ok(result);
        }

        /// <summary>Đổi mật khẩu (yêu cầu đăng nhập)</summary>
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var ownerId = GetCurrentOwnerId();
            await _authService.ChangePasswordAsync(ownerId, dto);
            return Ok(new { message = "Password changed successfully." });
        }

        /// <summary>Cập nhật hồ sơ cá nhân</summary>
        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var ownerId = GetCurrentOwnerId();
            await _authService.UpdateProfileAsync(ownerId, dto);
            return Ok(new { message = "Profile updated successfully." });
        }

        // ── Admin Auth ────────────────────────────────────────────────

        /// <summary>Đăng nhập Admin CMS</summary>
        [HttpPost("admin/login")]
        public async Task<ActionResult<AdminAuthResponseDto>> AdminLogin([FromBody] AdminLoginDto dto)
        {
            var result = await _authService.AdminLoginAsync(dto);
            return Ok(result);
        }

        // ── Helpers ───────────────────────────────────────────────────
        private int GetCurrentOwnerId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Owner ID not found in token.");
            return int.Parse(idClaim);
        }
    }
}

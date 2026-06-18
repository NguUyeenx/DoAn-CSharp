using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AdminAuthResponseDto> AdminLoginAsync(AdminLoginDto dto);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
        Task UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<OwnerDto> GetProfileAsync(int userId);
        Task PayRegistrationFeeAsync(string username, string cardNumber, string cardHolder);
    }
}

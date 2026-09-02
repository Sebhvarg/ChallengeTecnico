using Inventario.API.DTOs.Auth;

namespace Inventario.API.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserInfoDto> GetUserProfileAsync(int userId);
}

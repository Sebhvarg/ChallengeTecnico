using Inventario.API.DTOs.Auth;

namespace Inventario.API.Services.Interfaces;

public interface IAuthService
{
    Task<EncryptedResponseDto> LoginAsync(LoginRequestDto request);
    Task<EncryptedResponseDto> GetUserProfileAsync(int userId);
}

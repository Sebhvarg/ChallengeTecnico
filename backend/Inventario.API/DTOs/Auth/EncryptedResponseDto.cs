namespace Inventario.API.DTOs.Auth;

public class EncryptedResponseDto
{
    public string Payload { get; set; } = string.Empty;
    public string Iv { get; set; } = string.Empty;
}

namespace Inventario.API.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiracion { get; set; }
    public UserInfoDto Usuario { get; set; } = null!;
    public List<RutaDto> Rutas { get; set; } = new List<RutaDto>();
}

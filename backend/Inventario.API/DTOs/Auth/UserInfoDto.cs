namespace Inventario.API.DTOs.Auth;

public class UserInfoDto
{
    public int Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public string RolNombre { get; set; } = string.Empty;
}

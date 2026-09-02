using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "El usuario o correo electrónico es obligatorio")]
    public string Usuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    public string Contrasena { get; set; } = string.Empty;
}

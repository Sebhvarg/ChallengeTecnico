using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Usuario;

public class ActualizarUsuarioDto
{
    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Los nombres deben tener entre 2 y 80 caracteres.")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,80}$", ErrorMessage = "Los nombres solo deben contener letras y espacios.")]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Los apellidos deben tener entre 2 y 80 caracteres.")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,80}$", ErrorMessage = "Los apellidos solo deben contener letras y espacios.")]
    public string Apellidos { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [StringLength(50, ErrorMessage = "El correo no puede exceder 50 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "El formato de correo no es válido.")]
    public string Email { get; set; } = string.Empty;

    [StringLength(50, MinimumLength = 6, ErrorMessage = "La nueva contraseña debe tener al menos 6 caracteres.")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "El rol es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol válido.")]
    public int IdRol { get; set; }

    public bool Estado { get; set; } = true;
}

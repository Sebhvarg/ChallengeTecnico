using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Proveedor;

public class CrearProveedorDto
{
    [Required(ErrorMessage = "El nombre del proveedor es obligatorio")]
    [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato de correo no es válido")]
    [StringLength(50, ErrorMessage = "El correo no puede exceder 50 caracteres")]
    public string Email { get; set; } = string.Empty;

    [StringLength(10, ErrorMessage = "El celular no puede exceder 10 dígitos")]
    public string? Celular { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Proveedor;

public class CrearProveedorDto
{
    [Required(ErrorMessage = "El nombre del proveedor es obligatorio.")]
    [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,&'\-_/()]{2,80}$", ErrorMessage = "El nombre contiene caracteres inválidos.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [StringLength(50, ErrorMessage = "El correo no puede exceder 50 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "El formato de correo no es válido.")]
    public string Email { get; set; } = string.Empty;

    [StringLength(10, ErrorMessage = "El celular no puede exceder 10 dígitos.")]
    [RegularExpression(@"^$|^\d{7,10}$", ErrorMessage = "El teléfono/celular debe contener entre 7 y 10 dígitos numéricos.")]
    public string? Celular { get; set; }
}

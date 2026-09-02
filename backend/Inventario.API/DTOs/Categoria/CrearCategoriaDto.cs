using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Categoria;

public class CrearCategoriaDto
{
    [Required(ErrorMessage = "El nombre de la categoría es obligatorio")]
    [StringLength(30, ErrorMessage = "La categoría no puede exceder 30 caracteres")]
    public string Categoria { get; set; } = string.Empty;
}

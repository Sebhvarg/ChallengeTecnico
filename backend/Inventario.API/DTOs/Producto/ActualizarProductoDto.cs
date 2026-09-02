using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Producto;

public class ActualizarProductoDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
    public string? Descripcion { get; set; }

    public int? IdCategoria { get; set; }

    public bool Estado { get; set; } = true;

    // Opcional: Actualización directa de lote existente
    public int? IdProveedorProducto { get; set; }
    public decimal? CostoProducto { get; set; }
    public decimal? PrecioProducto { get; set; }
    public int? StockProducto { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Producto;

public class CrearProductoDto
{
    [Required(ErrorMessage = "El código es obligatorio")]
    [StringLength(4, MinimumLength = 1, ErrorMessage = "El código debe tener entre 1 y 4 caracteres")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
    public string? Descripcion { get; set; }

    public int? IdCategoria { get; set; }

    [Required(ErrorMessage = "El proveedor es obligatorio")]
    public int IdProveedor { get; set; }

    [Required(ErrorMessage = "El número de lote es obligatorio")]
    [StringLength(11, ErrorMessage = "El número de lote debe tener formato tipo LOT-0001-01 (máx 11 caracteres)")]
    public string NumeroLote { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "El costo no puede ser negativo")]
    public decimal CostoProducto { get; set; } = 0.00m;

    [Range(0, double.MaxValue, ErrorMessage = "El precio de venta no puede ser negativo")]
    public decimal PrecioProducto { get; set; } = 0.00m;

    [Range(0, int.MaxValue, ErrorMessage = "El stock inicial no puede ser negativo")]
    public int StockProducto { get; set; } = 1;
}

using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Producto;

public class CrearLoteDto
{
    [Required(ErrorMessage = "El ID del producto es obligatorio")]
    public int IdProducto { get; set; }

    [Required(ErrorMessage = "El ID del proveedor es obligatorio")]
    public int IdProveedor { get; set; }

    [Required(ErrorMessage = "El número de lote es obligatorio.")]
    [StringLength(11, ErrorMessage = "El número de lote no puede exceder 11 caracteres.")]
    [RegularExpression(@"^LOT-\d{4}-\d{2}$|^[A-Za-z0-9\-_]{3,11}$", ErrorMessage = "El formato de lote no es válido (ejemplo estándar: LOT-0001-01 o entre 3 y 11 caracteres alfanuméricos).")]
    public string NumeroLote { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "El costo no puede ser negativo.")]
    public decimal CostoProducto { get; set; } = 0.00m;

    [Range(0, double.MaxValue, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioProducto { get; set; } = 0.00m;

    [Range(1, int.MaxValue, ErrorMessage = "El stock inicial debe ser al menos 1 unidad.")]
    public int StockProducto { get; set; } = 1;
}

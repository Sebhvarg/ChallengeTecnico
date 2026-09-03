using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Producto;

public class CrearProductoDto
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [StringLength(4, MinimumLength = 1, ErrorMessage = "El código debe tener entre 1 y 4 caracteres.")]
    [RegularExpression(@"^[A-Za-z0-9]{1,4}$", ErrorMessage = "El código debe ser alfanumérico y contener máximo 4 caracteres sin espacios ni símbolos especiales.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-_#/()]{2,80}$", ErrorMessage = "El nombre contiene caracteres no permitidos (solo letras, números y puntuación básica).")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-_#/()]{0,200}$", ErrorMessage = "La descripción contiene caracteres no permitidos.")]
    public string? Descripcion { get; set; }

    public int? IdCategoria { get; set; }

    [Required(ErrorMessage = "El proveedor es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un proveedor válido.")]
    public int IdProveedor { get; set; }

    [Required(ErrorMessage = "El número de lote es obligatorio.")]
    [StringLength(11, ErrorMessage = "El número de lote debe tener formato tipo LOT-0001-01 (máx 11 caracteres).")]
    [RegularExpression(@"^LOT-\d{4}-\d{2}$|^[A-Za-z0-9\-_]{3,11}$", ErrorMessage = "El formato de lote no es válido (ejemplo estándar: LOT-0001-01 o entre 3 y 11 caracteres alfanuméricos).")]
    public string NumeroLote { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "El costo no puede ser negativo.")]
    public decimal CostoProducto { get; set; } = 0.00m;

    [Range(0, double.MaxValue, ErrorMessage = "El precio de venta no puede ser negativo.")]
    public decimal PrecioProducto { get; set; } = 0.00m;

    [Range(1, int.MaxValue, ErrorMessage = "El stock inicial debe ser al menos 1 unidad.")]
    public int StockProducto { get; set; } = 1;
}

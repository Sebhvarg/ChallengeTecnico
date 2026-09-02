namespace Inventario.API.DTOs.Inventario;

public class InventarioDto
{
    public int Id { get; set; }
    public int IdLote { get; set; }
    public string? NumeroLote { get; set; }
    public int IdProducto { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string ProductoNombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public int IdProveedor { get; set; }
    public string ProveedorNombre { get; set; } = string.Empty;
    public decimal CostoProducto { get; set; }
    public decimal PrecioProducto { get; set; }
    public int StockProducto { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
}

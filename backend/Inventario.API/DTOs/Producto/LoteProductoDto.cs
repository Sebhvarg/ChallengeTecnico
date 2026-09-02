namespace Inventario.API.DTOs.Producto;

public class LoteProductoDto
{
    public int IdProveedorProducto { get; set; }
    public string? NumeroLote { get; set; }
    public int IdProveedor { get; set; }
    public string ProveedorNombre { get; set; } = string.Empty;
    public decimal CostoProducto { get; set; }
    public decimal PrecioProducto { get; set; }
    public int StockProducto { get; set; }
    public bool Estado { get; set; }
}

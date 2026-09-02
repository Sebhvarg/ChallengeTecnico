namespace Inventario.API.DTOs.Producto;

public class ProductoListItemDto
{
    public int IdProducto { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string? NumeroLote { get; set; }
    public int IdProveedor { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public decimal CostoProducto { get; set; }
    public decimal PrecioProducto { get; set; }
    public int StockProducto { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

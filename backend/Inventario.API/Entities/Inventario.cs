namespace Inventario.API.Entities;

public class Inventario
{
    public int Id { get; set; }
    public int IdLote { get; set; }
    public decimal CostoProducto { get; set; }
    public decimal PrecioProducto { get; set; }
    public int StockProducto { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    public virtual ProveedorXProducto ProveedorXProducto { get; set; } = null!;
}

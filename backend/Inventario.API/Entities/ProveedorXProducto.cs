namespace Inventario.API.Entities;

public class ProveedorXProducto
{
    public int Id { get; set; }
    public string? NumeroLote { get; set; }
    public int IdProveedor { get; set; }
    public int IdProducto { get; set; }
    public bool Estado { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Proveedor Proveedor { get; set; } = null!;
    public virtual Producto Producto { get; set; } = null!;
    public virtual Inventario? Inventario { get; set; }
}

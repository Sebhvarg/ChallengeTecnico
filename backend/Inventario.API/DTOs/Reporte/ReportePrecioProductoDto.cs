namespace Inventario.API.DTOs.Reporte;

public class ReportePrecioProductoDto
{
    public string Producto { get; set; } = string.Empty;
    public Dictionary<string, decimal> PreciosPorProveedor { get; set; } = new Dictionary<string, decimal>();
}

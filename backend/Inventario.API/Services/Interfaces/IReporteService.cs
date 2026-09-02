using Inventario.API.DTOs.Reporte;

namespace Inventario.API.Services.Interfaces;

public interface IReporteService
{
    Task<List<ReportePrecioProductoDto>> ObtenerReportePreciosPorProveedorAsync(string? filtro);
}

using Inventario.API.Data;
using Inventario.API.DTOs.Reporte;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class ReporteService : IReporteService
{
    private readonly AppDbContext _context;

    public ReporteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReportePrecioProductoDto>> ObtenerReportePreciosPorProveedorAsync(string? filtro)
    {
        var query = from p in _context.Productos
                    join pxp in _context.ProveedorXProductos on p.Id equals pxp.IdProducto
                    join pr in _context.Proveedores on pxp.IdProveedor equals pr.Id
                    join inv in _context.Inventarios on pxp.Id equals inv.IdLote
                    where p.Estado && pxp.Estado && pr.Estado
                    select new
                    {
                        ProductoNombre = p.Nombre,
                        ProveedorNombre = pr.Nombre,
                        Precio = inv.PrecioProducto
                    };

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var clean = filtro.Trim().ToLower();
            query = query.Where(x => x.ProductoNombre.ToLower().Contains(clean));
        }

        var rawData = await query.AsNoTracking().ToListAsync();

        var proveedores = await _context.Proveedores
            .Where(p => p.Estado)
            .OrderBy(p => p.Id)
            .Select(p => p.Nombre)
            .AsNoTracking()
            .ToListAsync();

        var agrupado = rawData
            .GroupBy(x => x.ProductoNombre)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var dicPrecios = new Dictionary<string, decimal>();
                foreach (var prov in proveedores)
                {
                    var item = g.FirstOrDefault(x => x.ProveedorNombre == prov);
                    dicPrecios[prov] = item != null ? item.Precio : 0.00m;
                }

                return new ReportePrecioProductoDto
                {
                    Producto = g.Key,
                    PreciosPorProveedor = dicPrecios
                };
            })
            .ToList();

        return agrupado;
    }
}

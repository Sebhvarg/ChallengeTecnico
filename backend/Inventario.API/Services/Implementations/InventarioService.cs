using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Responses;
using Inventario.API.Data;
using Inventario.API.DTOs.Inventario;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class InventarioService : IInventarioService
{
    private readonly AppDbContext _context;
    private readonly ILogger<InventarioService> _logger;

    public InventarioService(AppDbContext context, ILogger<InventarioService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<InventarioDto>> ObtenerInventarioAsync(string? filtro, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var query = from inv in _context.Inventarios
                    join pxp in _context.ProveedorXProductos on inv.IdLote equals pxp.Id
                    join p in _context.Productos on pxp.IdProducto equals p.Id
                    join pr in _context.Proveedores on pxp.IdProveedor equals pr.Id
                    join c in _context.Categorias on p.IdCategoria equals c.Id into catGroup
                    from c in catGroup.DefaultIfEmpty()
                    where p.Estado && pxp.Estado
                    select new { inv, pxp, p, pr, c };

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var clean = filtro.Trim().ToLower();
            query = query.Where(x => x.p.Nombre.ToLower().Contains(clean) ||
                                     x.p.Codigo.ToLower().Contains(clean) ||
                                     (x.pxp.NumeroLote != null && x.pxp.NumeroLote.ToLower().Contains(clean)) ||
                                     x.pr.Nombre.ToLower().Contains(clean));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.p.Nombre)
            .ThenBy(x => x.pxp.NumeroLote)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(x => new InventarioDto
            {
                Id = x.inv.Id,
                IdLote = x.pxp.Id,
                NumeroLote = x.pxp.NumeroLote,
                IdProducto = x.p.Id,
                CodigoProducto = x.p.Codigo,
                ProductoNombre = x.p.Nombre,
                CategoriaNombre = x.c != null ? x.c.Categoria : "Sin Categoría",
                IdProveedor = x.pr.Id,
                ProveedorNombre = x.pr.Nombre,
                CostoProducto = x.inv.CostoProducto,
                PrecioProducto = x.inv.PrecioProducto,
                StockProducto = x.inv.StockProducto,
                Estado = x.pxp.Estado,
                FechaCreacion = x.inv.FechaCreacion,
                FechaActualizacion = x.inv.FechaActualizacion
            })
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<InventarioDto>(items, total, pagina, tamanoPagina);
    }

    public async Task<InventarioDto> AjustarStockAsync(AjustarStockDto dto)
    {
        var inventario = await _context.Inventarios
            .Include(i => i.ProveedorXProducto)
                .ThenInclude(pxp => pxp.Producto)
                    .ThenInclude(p => p.Categoria)
            .Include(i => i.ProveedorXProducto)
                .ThenInclude(pxp => pxp.Proveedor)
            .FirstOrDefaultAsync(i => i.IdLote == dto.IdLote);

        if (inventario == null)
        {
            throw new NotFoundException($"No se encontró inventario para el lote con ID {dto.IdLote}.");
        }

        switch (dto.TipoAjuste.ToLower().Trim())
        {
            case "incrementar":
                if (dto.Cantidad <= 0)
                    throw new BadRequestException("La cantidad a incrementar debe ser mayor a 0.");
                inventario.StockProducto += dto.Cantidad;
                break;

            case "decrementar":
                if (dto.Cantidad <= 0)
                    throw new BadRequestException("La cantidad a decrementar debe ser mayor a 0.");
                if (inventario.StockProducto - dto.Cantidad < 0)
                    throw new BadRequestException($"Stock insuficiente. El stock actual es {inventario.StockProducto}.");
                inventario.StockProducto -= dto.Cantidad;
                break;

            case "fijar":
                if (dto.Cantidad < 0)
                    throw new BadRequestException("El stock no puede ser negativo.");
                inventario.StockProducto = dto.Cantidad;
                break;

            default:
                throw new BadRequestException("Tipo de ajuste no válido. Use 'Incrementar', 'Decrementar' o 'Fijar'.");
        }

        if (dto.NuevoCosto.HasValue)
            inventario.CostoProducto = dto.NuevoCosto.Value;

        if (dto.NuevoPrecio.HasValue)
            inventario.PrecioProducto = dto.NuevoPrecio.Value;

        inventario.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Stock ajustado para lote {IdLote}. Nuevo stock: {Stock}", dto.IdLote, inventario.StockProducto);

        return new InventarioDto
        {
            Id = inventario.Id,
            IdLote = inventario.IdLote,
            NumeroLote = inventario.ProveedorXProducto.NumeroLote,
            IdProducto = inventario.ProveedorXProducto.IdProducto,
            CodigoProducto = inventario.ProveedorXProducto.Producto.Codigo,
            ProductoNombre = inventario.ProveedorXProducto.Producto.Nombre,
            CategoriaNombre = inventario.ProveedorXProducto.Producto.Categoria?.Categoria ?? "Sin Categoría",
            IdProveedor = inventario.ProveedorXProducto.IdProveedor,
            ProveedorNombre = inventario.ProveedorXProducto.Proveedor.Nombre,
            CostoProducto = inventario.CostoProducto,
            PrecioProducto = inventario.PrecioProducto,
            StockProducto = inventario.StockProducto,
            Estado = inventario.ProveedorXProducto.Estado,
            FechaCreacion = inventario.FechaCreacion,
            FechaActualizacion = inventario.FechaActualizacion
        };
    }

    public async Task<List<InventarioDto>> ObtenerLotesPorProductoAsync(int idProducto)
    {
        return await (from inv in _context.Inventarios
                      join pxp in _context.ProveedorXProductos on inv.IdLote equals pxp.Id
                      join p in _context.Productos on pxp.IdProducto equals p.Id
                      join pr in _context.Proveedores on pxp.IdProveedor equals pr.Id
                      join c in _context.Categorias on p.IdCategoria equals c.Id into catGroup
                      from c in catGroup.DefaultIfEmpty()
                      where pxp.IdProducto == idProducto && pxp.Estado
                      select new InventarioDto
                      {
                          Id = inv.Id,
                          IdLote = pxp.Id,
                          NumeroLote = pxp.NumeroLote,
                          IdProducto = p.Id,
                          CodigoProducto = p.Codigo,
                          ProductoNombre = p.Nombre,
                          CategoriaNombre = c != null ? c.Categoria : "Sin Categoría",
                          IdProveedor = pr.Id,
                          ProveedorNombre = pr.Nombre,
                          CostoProducto = inv.CostoProducto,
                          PrecioProducto = inv.PrecioProducto,
                          StockProducto = inv.StockProducto,
                          Estado = pxp.Estado,
                          FechaCreacion = inv.FechaCreacion,
                          FechaActualizacion = inv.FechaActualizacion
                      })
                      .AsNoTracking()
                      .ToListAsync();
    }
}

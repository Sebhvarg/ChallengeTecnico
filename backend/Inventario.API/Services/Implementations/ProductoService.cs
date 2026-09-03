using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Responses;
using Inventario.API.Data;
using Inventario.API.DTOs.Producto;
using Inventario.API.Entities;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class ProductoService : IProductoService
{
    private readonly AppDbContext _context;
    private readonly IAuditoriaService _auditoriaService;
    private readonly ILogger<ProductoService> _logger;

    public ProductoService(
        AppDbContext context,
        IAuditoriaService auditoriaService,
        ILogger<ProductoService> logger)
    {
        _context = context;
        _auditoriaService = auditoriaService;
        _logger = logger;
    }

    public async Task<PagedResult<ProductoListItemDto>> BuscarProductosAsync(string? filtro, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var query = from p in _context.Productos
                    join c in _context.Categorias on p.IdCategoria equals c.Id into catGroup
                    from c in catGroup.DefaultIfEmpty()
                    join pxp in _context.ProveedorXProductos on p.Id equals pxp.IdProducto
                    join pr in _context.Proveedores on pxp.IdProveedor equals pr.Id
                    join inv in _context.Inventarios on pxp.Id equals inv.IdLote
                    where p.Estado && pxp.Estado
                    select new { p, c, pxp, pr, inv };

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var cleanFilter = filtro.Trim().ToLower();
            query = query.Where(x => x.p.Nombre.ToLower().Contains(cleanFilter) ||
                                     x.p.Codigo.ToLower().Contains(cleanFilter) ||
                                     (x.pxp.NumeroLote != null && x.pxp.NumeroLote.ToLower().Contains(cleanFilter)) ||
                                     x.pr.Nombre.ToLower().Contains(cleanFilter));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.p.Id)
            .ThenBy(x => x.pxp.NumeroLote)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(x => new ProductoListItemDto
            {
                IdProducto = x.p.Id,
                Codigo = x.p.Codigo,
                Producto = x.p.Nombre,
                Categoria = x.c != null ? x.c.Categoria : "Sin Categoría",
                NumeroLote = x.pxp.NumeroLote,
                IdProveedor = x.pr.Id,
                Proveedor = x.pr.Nombre,
                CostoProducto = x.inv.CostoProducto,
                PrecioProducto = x.inv.PrecioProducto,
                StockProducto = x.inv.StockProducto,
                Estado = x.p.Estado,
                FechaCreacion = x.p.FechaCreacion
            })
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<ProductoListItemDto>(items, totalRegistros, pagina, tamanoPagina);
    }

    public async Task<ProductoDto> ObtenerPorIdAsync(int id)
    {
        var producto = await _context.Productos
            .Include(p => p.Categoria)
            .Include(p => p.ProveedorXProductos.Where(pxp => pxp.Estado))
                .ThenInclude(pxp => pxp.Proveedor)
            .Include(p => p.ProveedorXProductos.Where(pxp => pxp.Estado))
                .ThenInclude(pxp => pxp.Inventario)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.Estado);

        if (producto == null)
        {
            throw new NotFoundException($"El producto con ID {id} no fue encontrado.");
        }

        return MapToProductoDto(producto);
    }

    public async Task<ProductoDto> ObtenerPorCodigoAsync(string codigo)
    {
        var cleanCode = codigo.Trim().ToUpper();

        var producto = await _context.Productos
            .Include(p => p.Categoria)
            .Include(p => p.ProveedorXProductos.Where(pxp => pxp.Estado))
                .ThenInclude(pxp => pxp.Proveedor)
            .Include(p => p.ProveedorXProductos.Where(pxp => pxp.Estado))
                .ThenInclude(pxp => pxp.Inventario)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Codigo == cleanCode && p.Estado);

        if (producto == null)
        {
            throw new NotFoundException($"El producto con código '{codigo}' no fue encontrado.");
        }

        return MapToProductoDto(producto);
    }

    public async Task<ProductoDto> CrearProductoAsync(CrearProductoDto dto)
    {
        var codigo = dto.Codigo.Trim().ToUpper();
        var nombre = dto.Nombre.Trim();
        var lote = dto.NumeroLote.Trim().ToUpper();

        if (await _context.Productos.AnyAsync(p => p.Codigo == codigo))
        {
            throw new BadRequestException($"Ya existe un producto registrado con el código '{codigo}'.");
        }

        var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.Id == dto.IdProveedor && p.Estado);
        if (proveedor == null)
        {
            throw new BadRequestException("El proveedor especificado no existe o está inactivo.");
        }

        if (dto.IdCategoria.HasValue)
        {
            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == dto.IdCategoria.Value && c.Estado);
            if (!categoriaExiste)
            {
                throw new BadRequestException("La categoría especificada no existe o está inactiva.");
            }
        }

        if (await _context.ProveedorXProductos.AnyAsync(pxp => pxp.NumeroLote == lote))
        {
            throw new BadRequestException($"El número de lote '{lote}' ya se encuentra registrado.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var producto = new Producto
            {
                Codigo = codigo,
                Nombre = nombre,
                Descripcion = dto.Descripcion?.Trim(),
                IdCategoria = dto.IdCategoria,
                Estado = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            var proveedorXProducto = new ProveedorXProducto
            {
                NumeroLote = lote,
                IdProveedor = dto.IdProveedor,
                IdProducto = producto.Id,
                Estado = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.ProveedorXProductos.Add(proveedorXProducto);
            await _context.SaveChangesAsync();

            var inventario = new Entities.Inventario
            {
                IdLote = proveedorXProducto.Id,
                CostoProducto = dto.CostoProducto,
                PrecioProducto = dto.PrecioProducto,
                StockProducto = dto.StockProducto,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Inventarios.Add(inventario);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            _logger.LogInformation("Producto {Codigo} - {Nombre} creado exitosamente con Lote {Lote}.", codigo, nombre, lote);
            await _auditoriaService.RegistrarAsync("CREAR_PRODUCTO", "Productos", $"Se creó el producto '{codigo} - {nombre}' con lote inicial {lote}.");

            return await ObtenerPorIdAsync(producto.Id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error al crear producto con código {Codigo}", codigo);
            throw;
        }
    }

    public async Task<ProductoDto> ActualizarProductoAsync(int id, ActualizarProductoDto dto)
    {
        var producto = await _context.Productos
            .Include(p => p.ProveedorXProductos)
                .ThenInclude(pxp => pxp.Inventario)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto == null)
        {
            throw new NotFoundException($"El producto con ID {id} no fue encontrado.");
        }

        if (dto.IdCategoria.HasValue)
        {
            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == dto.IdCategoria.Value && c.Estado);
            if (!categoriaExiste)
            {
                throw new BadRequestException("La categoría especificada no existe o está inactiva.");
            }
        }

        producto.Nombre = dto.Nombre.Trim();
        producto.Descripcion = dto.Descripcion?.Trim();
        producto.IdCategoria = dto.IdCategoria;
        producto.Estado = dto.Estado;

        if (dto.IdProveedorProducto.HasValue)
        {
            var pxp = producto.ProveedorXProductos.FirstOrDefault(x => x.Id == dto.IdProveedorProducto.Value);
            if (pxp != null && pxp.Inventario != null)
            {
                if (dto.CostoProducto.HasValue)
                    pxp.Inventario.CostoProducto = dto.CostoProducto.Value;
                if (dto.PrecioProducto.HasValue)
                    pxp.Inventario.PrecioProducto = dto.PrecioProducto.Value;
                if (dto.StockProducto.HasValue)
                    pxp.Inventario.StockProducto = dto.StockProducto.Value;

                pxp.Inventario.FechaActualizacion = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Producto ID {Id} actualizado correctamente.", id);
        await _auditoriaService.RegistrarAsync("EDITAR_PRODUCTO", "Productos", $"Se actualizaron los datos del producto ID {id} ('{producto.Nombre}').");

        return await ObtenerPorIdAsync(id);
    }

    public async Task<bool> EliminarProductoAsync(int id)
    {
        var producto = await _context.Productos
            .Include(p => p.ProveedorXProductos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto == null)
        {
            throw new NotFoundException($"El producto con ID {id} no fue encontrado.");
        }

        if (!producto.Estado)
        {
            throw new BadRequestException("El producto ya se encuentra inactivo.");
        }

        producto.Estado = false;

        foreach (var pxp in producto.ProveedorXProductos)
        {
            pxp.Estado = false;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Producto ID {Id} desactivado exitosamente.", id);
        await _auditoriaService.RegistrarAsync("DESACTIVAR_PRODUCTO", "Productos", $"Se desactivó el producto ID {id} ('{producto.Nombre}').");

        return true;
    }

    public async Task<LoteProductoDto> AgregarLoteAsync(CrearLoteDto dto)
    {
        var lote = dto.NumeroLote.Trim().ToUpper();

        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == dto.IdProducto && p.Estado);
        if (producto == null)
        {
            throw new NotFoundException($"El producto con ID {dto.IdProducto} no existe.");
        }

        var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.Id == dto.IdProveedor && p.Estado);
        if (proveedor == null)
        {
            throw new NotFoundException($"El proveedor con ID {dto.IdProveedor} no existe o está inactivo.");
        }

        if (await _context.ProveedorXProductos.AnyAsync(pxp => pxp.NumeroLote == lote))
        {
            throw new BadRequestException($"El número de lote '{lote}' ya se encuentra registrado.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var pxp = new ProveedorXProducto
            {
                IdProducto = dto.IdProducto,
                IdProveedor = dto.IdProveedor,
                NumeroLote = lote,
                Estado = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.ProveedorXProductos.Add(pxp);
            await _context.SaveChangesAsync();

            var inv = new Entities.Inventario
            {
                IdLote = pxp.Id,
                CostoProducto = dto.CostoProducto,
                PrecioProducto = dto.PrecioProducto,
                StockProducto = dto.StockProducto,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Inventarios.Add(inv);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            await _auditoriaService.RegistrarAsync("CREAR_LOTE", "Inventario", $"Se agregó el lote '{lote}' con stock {dto.StockProducto} para el producto '{producto.Nombre}'.");

            return new LoteProductoDto
            {
                IdProveedorProducto = pxp.Id,
                NumeroLote = pxp.NumeroLote,
                IdProveedor = proveedor.Id,
                ProveedorNombre = proveedor.Nombre,
                CostoProducto = inv.CostoProducto,
                PrecioProducto = inv.PrecioProducto,
                StockProducto = inv.StockProducto,
                Estado = pxp.Estado
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error al agregar lote al producto ID {IdProducto}", dto.IdProducto);
            throw;
        }
    }

    private static ProductoDto MapToProductoDto(Producto producto)
    {
        return new ProductoDto
        {
            Id = producto.Id,
            Codigo = producto.Codigo,
            Nombre = producto.Nombre,
            Descripcion = producto.Descripcion,
            IdCategoria = producto.IdCategoria,
            CategoriaNombre = producto.Categoria?.Categoria,
            Estado = producto.Estado,
            FechaCreacion = producto.FechaCreacion,
            Lotes = producto.ProveedorXProductos.Select(pxp => new LoteProductoDto
            {
                IdProveedorProducto = pxp.Id,
                NumeroLote = pxp.NumeroLote,
                IdProveedor = pxp.IdProveedor,
                ProveedorNombre = pxp.Proveedor?.Nombre ?? string.Empty,
                CostoProducto = pxp.Inventario?.CostoProducto ?? 0,
                PrecioProducto = pxp.Inventario?.PrecioProducto ?? 0,
                StockProducto = pxp.Inventario?.StockProducto ?? 0,
                Estado = pxp.Estado
            }).ToList()
        };
    }
}

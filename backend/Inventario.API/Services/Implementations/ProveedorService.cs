using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Responses;
using Inventario.API.Data;
using Inventario.API.DTOs.Proveedor;
using Inventario.API.Entities;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class ProveedorService : IProveedorService
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProveedorService> _logger;

    public ProveedorService(AppDbContext context, ILogger<ProveedorService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<ProveedorDto>> BuscarProveedoresAsync(string? filtro, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var query = _context.Proveedores.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var clean = filtro.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(clean) || p.Email.ToLower().Contains(clean));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Id)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(p => new ProveedorDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Email = p.Email,
                Celular = p.Celular,
                Estado = p.Estado,
                FechaCreacion = p.FechaCreacion
            })
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<ProveedorDto>(items, total, pagina, tamanoPagina);
    }

    public async Task<List<ProveedorDto>> ObtenerTodosActivosAsync()
    {
        return await _context.Proveedores
            .Where(p => p.Estado)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Email = p.Email,
                Celular = p.Celular,
                Estado = p.Estado,
                FechaCreacion = p.FechaCreacion
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<ProveedorDto> ObtenerPorIdAsync(int id)
    {
        var proveedor = await _context.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proveedor == null)
        {
            throw new NotFoundException($"El proveedor con ID {id} no fue encontrado.");
        }

        return new ProveedorDto
        {
            Id = proveedor.Id,
            Nombre = proveedor.Nombre,
            Email = proveedor.Email,
            Celular = proveedor.Celular,
            Estado = proveedor.Estado,
            FechaCreacion = proveedor.FechaCreacion
        };
    }

    public async Task<ProveedorDto> CrearProveedorAsync(CrearProveedorDto dto)
    {
        var nombre = dto.Nombre.Trim();
        var email = dto.Email.Trim().ToLower();

        if (await _context.Proveedores.AnyAsync(p => p.Email.ToLower() == email))
        {
            throw new BadRequestException($"Ya existe un proveedor registrado con el correo '{email}'.");
        }

        if (await _context.Proveedores.AnyAsync(p => p.Nombre.ToLower() == nombre.ToLower()))
        {
            throw new BadRequestException($"Ya existe un proveedor registrado con el nombre '{nombre}'.");
        }

        var proveedor = new Proveedor
        {
            Nombre = nombre,
            Email = email,
            Celular = dto.Celular?.Trim(),
            Estado = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Proveedor {Nombre} creado con ID {Id}.", proveedor.Nombre, proveedor.Id);

        return await ObtenerPorIdAsync(proveedor.Id);
    }

    public async Task<ProveedorDto> ActualizarProveedorAsync(int id, ActualizarProveedorDto dto)
    {
        var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.Id == id);
        if (proveedor == null)
        {
            throw new NotFoundException($"El proveedor con ID {id} no fue encontrado.");
        }

        var nombre = dto.Nombre.Trim();
        var email = dto.Email.Trim().ToLower();

        if (await _context.Proveedores.AnyAsync(p => p.Id != id && p.Email.ToLower() == email))
        {
            throw new BadRequestException($"El correo '{email}' ya está en uso por otro proveedor.");
        }

        if (await _context.Proveedores.AnyAsync(p => p.Id != id && p.Nombre.ToLower() == nombre.ToLower()))
        {
            throw new BadRequestException($"El nombre '{nombre}' ya está en uso por otro proveedor.");
        }

        proveedor.Nombre = nombre;
        proveedor.Email = email;
        proveedor.Celular = dto.Celular?.Trim();
        proveedor.Estado = dto.Estado;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Proveedor ID {Id} actualizado correctamente.", id);

        return await ObtenerPorIdAsync(id);
    }

    public async Task<bool> EliminarProveedorAsync(int id)
    {
        var proveedor = await _context.Proveedores
            .Include(p => p.ProveedorXProductos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proveedor == null)
        {
            throw new NotFoundException($"El proveedor con ID {id} no fue encontrado.");
        }

        if (!proveedor.Estado)
        {
            throw new BadRequestException("El proveedor ya se encuentra inactivo.");
        }

        proveedor.Estado = false;

        foreach (var pxp in proveedor.ProveedorXProductos)
        {
            pxp.Estado = false;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Proveedor ID {Id} desactivado exitosamente.", id);

        return true;
    }
}

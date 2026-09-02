using Inventario.API.Common.Exceptions;
using Inventario.API.Data;
using Inventario.API.DTOs.Categoria;
using Inventario.API.Entities;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class CategoriaService : ICategoriaService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CategoriaService> _logger;

    public CategoriaService(AppDbContext context, ILogger<CategoriaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<CategoriaDto>> ObtenerTodasActivasAsync()
    {
        return await _context.Categorias
            .Where(c => c.Estado)
            .OrderBy(c => c.Categoria)
            .Select(c => new CategoriaDto
            {
                Id = c.Id,
                Categoria = c.Categoria,
                Estado = c.Estado
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<CategoriaDto> CrearCategoriaAsync(CrearCategoriaDto dto)
    {
        var nombre = dto.Categoria.Trim();

        if (await _context.Categorias.AnyAsync(c => c.Categoria.ToLower() == nombre.ToLower()))
        {
            throw new BadRequestException($"La categoría '{nombre}' ya se encuentra registrada.");
        }

        var categoria = new CategoriaProducto
        {
            Categoria = nombre,
            Estado = true
        };

        _context.Categorias.Add(categoria);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Categoría {Categoria} creada con ID {Id}.", categoria.Categoria, categoria.Id);

        return new CategoriaDto
        {
            Id = categoria.Id,
            Categoria = categoria.Categoria,
            Estado = categoria.Estado
        };
    }
}

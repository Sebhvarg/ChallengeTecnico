using System.Text.RegularExpressions;
using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Log;
using Inventario.API.Services.Interfaces;

namespace Inventario.API.Services.Implementations;

public class LogService : ILogService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LogService> _logger;
    private static readonly Regex LogRegex = new(
        @"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+[\+\-]\d{2}:\d{2})\s+\[([A-Z]{3})\]\s+(.*)$",
        RegexOptions.Compiled);

    public LogService(IWebHostEnvironment env, ILogger<LogService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<PagedResult<LogItemDto>> ObtenerLogsAsync(string? filtro, string? nivel, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var allLogs = await LeerTodosLosLogsAsync();

        var query = allLogs.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(nivel) && nivel.ToUpper() != "TODOS")
        {
            var cleanNivel = nivel.Trim().ToUpper();
            query = query.Where(l => l.Nivel.Equals(cleanNivel, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var cleanFiltro = filtro.Trim().ToLower();
            query = query.Where(l => 
                l.Mensaje.ToLower().Contains(cleanFiltro) || 
                (l.Excepcion != null && l.Excepcion.ToLower().Contains(cleanFiltro)));
        }

        var total = query.Count();
        var items = query
            .OrderByDescending(l => l.Fecha)
            .ThenByDescending(l => l.Id)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .ToList();

        return new PagedResult<LogItemDto>(items, total, pagina, tamanoPagina);
    }

    public async Task<LogStatsDto> ObtenerEstadisticasLogsAsync()
    {
        var allLogs = await LeerTodosLosLogsAsync();
        return new LogStatsDto
        {
            Total = allLogs.Count,
            Errores = allLogs.Count(l => l.Nivel == "ERR" || l.Nivel == "FTL"),
            Advertencias = allLogs.Count(l => l.Nivel == "WRN"),
            Informacion = allLogs.Count(l => l.Nivel == "INF" || l.Nivel == "DBG")
        };
    }

    public Task<bool> LimpiarLogsAsync()
    {
        try
        {
            var logsDir = Path.Combine(_env.ContentRootPath, "Logs");
            if (Directory.Exists(logsDir))
            {
                var files = Directory.GetFiles(logsDir, "*.log");
                foreach (var file in files)
                {
                    try
                    {
                        File.WriteAllText(file, string.Empty);
                    }
                    catch
                    {
                        // Archivo en uso por Serilog, ignorar
                    }
                }
            }
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al limpiar archivos de logs.");
            return Task.FromResult(false);
        }
    }

    private async Task<List<LogItemDto>> LeerTodosLosLogsAsync()
    {
        var logs = new List<LogItemDto>();
        var logsDir = Path.Combine(_env.ContentRootPath, "Logs");

        if (!Directory.Exists(logsDir))
        {
            return logs;
        }

        var files = Directory.GetFiles(logsDir, "inventario-*.log")
            .OrderByDescending(f => f)
            .Take(7); // Últimos 7 días

        int logIdCounter = 1;

        foreach (var file in files)
        {
            try
            {
                using var fs = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var reader = new StreamReader(fs);

                LogItemDto? currentLog = null;

                while (await reader.ReadLineAsync() is { } line)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var match = LogRegex.Match(line);
                    if (match.Success)
                    {
                        if (currentLog != null)
                        {
                            logs.Add(currentLog);
                        }

                        var dateStr = match.Groups[1].Value;
                        var levelStr = match.Groups[2].Value;
                        var msgStr = match.Groups[3].Value;

                        DateTime parsedDate = DateTime.TryParse(dateStr, out var d) ? d : DateTime.UtcNow;

                        currentLog = new LogItemDto
                        {
                            Id = logIdCounter++,
                            Fecha = parsedDate,
                            Nivel = levelStr,
                            Mensaje = msgStr,
                            Excepcion = null
                        };
                    }
                    else if (currentLog != null)
                    {
                        // Línea adicional de stack trace o excepción
                        currentLog.Excepcion = currentLog.Excepcion == null 
                            ? line 
                            : currentLog.Excepcion + Environment.NewLine + line;
                    }
                }

                if (currentLog != null)
                {
                    logs.Add(currentLog);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al leer archivo de log: {File}", file);
            }
        }

        return logs;
    }
}

using System.Net;
using System.Text.Json;
using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Responses;

namespace Inventario.API.Middlewares;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "Ha ocurrido un error interno en el servidor.";
        var errors = new List<string>();

        switch (exception)
        {
            case AppException appEx:
                statusCode = (HttpStatusCode)appEx.StatusCode;
                message = appEx.Message;
                _logger.LogWarning(appEx, "Error de aplicación [{StatusCode}]: {Message}", appEx.StatusCode, appEx.Message);
                break;

            case KeyNotFoundException notFoundEx:
                statusCode = HttpStatusCode.NotFound;
                message = notFoundEx.Message;
                _logger.LogWarning(notFoundEx, "Recurso no encontrado: {Message}", notFoundEx.Message);
                break;

            case UnauthorizedAccessException authEx:
                statusCode = HttpStatusCode.Unauthorized;
                message = "No autorizado para acceder a este recurso.";
                _logger.LogWarning(authEx, "Acceso no autorizado");
                break;

            case InvalidOperationException invalidOpEx:
                statusCode = HttpStatusCode.BadRequest;
                message = invalidOpEx.Message;
                _logger.LogWarning(invalidOpEx, "Operación inválida: {Message}", invalidOpEx.Message);
                break;

            default:
                _logger.LogError(exception, "Error no controlado: {Message} | Ruta: {Path}", exception.Message, context.Request.Path);
                errors.Add(exception.Message);
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail(message, errors.Count > 0 ? errors : null, (int)statusCode);
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}

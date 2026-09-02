using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using Inventario.API.Data;
using Inventario.API.Middlewares;
using Inventario.API.Services.Implementations;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;

// 1. Configuración inicial de Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {NewLine}{Exception}")
    .WriteTo.File(
        path: "Logs/inventario-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Iniciando aplicación Inventario.API...");

    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // 2. Base de Datos (Entity Framework Core con SQL Server)
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Server=localhost;Database=Prueba;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;";

    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        });
    });

    // 3. Inyección de Dependencias (Servicios de Negocio)
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IProductoService, ProductoService>();
    builder.Services.AddScoped<IProveedorService, ProveedorService>();
    builder.Services.AddScoped<ICategoriaService, CategoriaService>();
    builder.Services.AddScoped<IInventarioService, InventarioService>();
    builder.Services.AddScoped<IReporteService, ReporteService>();

    // 4. Configuración de Controladores y Serialización JSON
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

    // 5. Configuración de CORS
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
        ?? new[] { "http://localhost:4200", "http://127.0.0.1:4200" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // 6. Configuración de Autenticación con JWT
    var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForInventoryChallengeBackendAngular2026!";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "InventoryApi";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "InventoryAngularClient";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();

    // 7. Configuración de Swagger / OpenAPI con soporte JWT
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "API de Gestión de Inventario de Productos",
            Version = "v1",
            Description = "API RESTful integral para el registro, control de inventario multimoneda/proveedor y autenticación con JWT.",
            Contact = new OpenApiContact
            {
                Name = "Desarrollador Full Stack",
                Email = "dev@challenge.local"
            }
        });

        // Configuración del esquema de seguridad JWT Bearer en Swagger UI
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "Autenticación JWT usando el esquema Bearer. \r\n\r\n Ingrese 'Bearer' [espacio] y luego su token.\r\n\r\nEjemplo: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    },
                    Scheme = "oauth2",
                    Name = "Bearer",
                    In = ParameterLocation.Header
                },
                new List<string>()
            }
        });

        // Incluir comentarios XML para documentación de Swagger
        var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            c.IncludeXmlComments(xmlPath);
        }
    });

    var app = builder.Build();

    // 8. Pipeline de Middlewares
    app.UseMiddleware<ErrorHandlingMiddleware>();

    // Middleware de logging de peticiones Serilog
    app.UseSerilogRequestLogging();

    // Swagger UI disponible en Development y Production
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Inventario v1");
        c.RoutePrefix = string.Empty; // Swagger en la raíz del backend (http://localhost:5000/)
        c.DocumentTitle = "Inventario API - Swagger Docs";
    });

    app.UseHttpsRedirection();

    app.UseCors("AllowAngularApp");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "La aplicación falló al iniciar inesperadamente.");
}
finally
{
    Log.CloseAndFlush();
}

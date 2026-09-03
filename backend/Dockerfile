# Etapa 1: Compilación y Publicación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto y restaurar dependencias
COPY Inventario.API/Inventario.API.csproj Inventario.API/
COPY InventarioSolution.sln .
RUN dotnet restore Inventario.API/Inventario.API.csproj

# Copiar el resto del código y compilar en modo Release
COPY . .
WORKDIR /src/Inventario.API
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Etapa 2: Imagen de Ejecución Ligera
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Crear directorio para almacenamiento de logs
RUN mkdir -p /app/logs

# Copiar artefactos publicados desde la etapa de compilación
COPY --from=build /app/publish .

# Variables de entorno por defecto
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["dotnet", "Inventario.API.dll"]

using Inventario.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ruta> Rutas => Set<Ruta>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<CategoriaProducto> Categorias => Set<CategoriaProducto>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ProveedorXProducto> ProveedorXProductos => Set<ProveedorXProducto>();
    public DbSet<Entities.Inventario> Inventarios => Set<Entities.Inventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Roles
        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RolNombre).HasColumnName("rol").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");
        });

        // Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nombres).HasColumnName("nombres").HasMaxLength(80).IsRequired();
            entity.Property(e => e.Apellidos).HasColumnName("apellidos").HasMaxLength(80).IsRequired();
            entity.Property(e => e.NombreUsuario).HasColumnName("usuario").HasMaxLength(10).IsRequired();
            entity.HasIndex(e => e.NombreUsuario).IsUnique();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ContrasenaHash).HasColumnName("contrasenaHash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.IdRol).HasColumnName("rol").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Rol)
                  .WithMany(r => r.Usuarios)
                  .HasForeignKey(e => e.IdRol)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Rutas
        modelBuilder.Entity<Ruta>(entity =>
        {
            entity.ToTable("Rutas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdRol).HasColumnName("idRol").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.Property(e => e.RutaUrl).HasColumnName("ruta").HasMaxLength(80).IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Rol)
                  .WithMany(r => r.Rutas)
                  .HasForeignKey(e => e.IdRol)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Proveedor
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("Proveedor");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Celular).HasColumnName("celular").HasMaxLength(10);
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");
        });

        // CategoriaProducto
        modelBuilder.Entity<CategoriaProducto>(entity =>
        {
            entity.ToTable("CategoriaProducto");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.Categoria).IsUnique();
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
        });

        // Producto
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("Producto");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Codigo).HasColumnName("codigo").HasMaxLength(4).IsRequired();
            entity.HasIndex(e => e.Codigo).IsUnique();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(200);
            entity.Property(e => e.IdCategoria).HasColumnName("idCategoria");
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Categoria)
                  .WithMany(c => c.Productos)
                  .HasForeignKey(e => e.IdCategoria)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ProveedorXProducto
        modelBuilder.Entity<ProveedorXProducto>(entity =>
        {
            entity.ToTable("ProveedorXProducto");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.NumeroLote).HasColumnName("NumeroLote").HasMaxLength(11);
            entity.HasIndex(e => e.NumeroLote).IsUnique();
            entity.Property(e => e.IdProveedor).HasColumnName("idProveedor").IsRequired();
            entity.Property(e => e.IdProducto).HasColumnName("idProducto").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Proveedor)
                  .WithMany(p => p.ProveedorXProductos)
                  .HasForeignKey(e => e.IdProveedor)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Producto)
                  .WithMany(p => p.ProveedorXProductos)
                  .HasForeignKey(e => e.IdProducto)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Inventario)
                  .WithOne(i => i.ProveedorXProducto)
                  .HasForeignKey<Entities.Inventario>(i => i.IdLote)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Inventario
        modelBuilder.Entity<Entities.Inventario>(entity =>
        {
            entity.ToTable("Inventario");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdLote).HasColumnName("idLote").IsRequired();
            entity.Property(e => e.CostoProducto).HasColumnName("costoProducto").HasColumnType("decimal(18,2)").HasDefaultValue(0.00m);
            entity.Property(e => e.PrecioProducto).HasColumnName("precioProducto").HasColumnType("decimal(18,2)").HasDefaultValue(0.00m);
            entity.Property(e => e.StockProducto).HasColumnName("stockProducto").HasDefaultValue(1);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.FechaActualizacion).HasColumnName("fechaActualizacion").HasDefaultValueSql("GETDATE()");
        });
    }
}

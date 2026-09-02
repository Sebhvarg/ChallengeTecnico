USE Prueba;
GO

CREATE OR ALTER PROCEDURE spLogin
    @usuario VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validación de parámetro de entrada
    IF @usuario IS NULL OR LTRIM(RTRIM(@usuario)) = ''
    BEGIN
        RAISERROR('El parámetro @usuario no puede estar vacío.', 16, 1);
        RETURN;
    END

    SELECT 
        u.id,
        u.nombres,
        u.apellidos,
        u.usuario,
        u.email,
        u.contrasenaHash,
        u.rol AS idRol,
        r.rol AS nombreRol,
        -- Subconsulta que empaqueta las rutas activas como un array JSON: [{"nombre":"...","ruta":"..."}, ...]
        (
            SELECT 
                ru.id,
                ru.nombre,
                ru.ruta
            FROM Rutas ru WITH (NOLOCK)
            WHERE ru.idRol = r.id AND ru.estado = 1
            FOR JSON PATH
        ) AS RutasJson
    FROM Usuario u WITH (NOLOCK)
    INNER JOIN Roles r WITH (NOLOCK) ON u.rol = r.id
    WHERE (u.usuario = LTRIM(RTRIM(@usuario)) OR u.email = LTRIM(RTRIM(@usuario)))
      AND r.estado = 1;
END;
GO

CREATE OR ALTER PROCEDURE spBuscarProveedores
    @proveedor VARCHAR(80) = '',
    @pagina INT = 1,
    @tamanoPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalización de paginación
    IF @pagina < 1 SET @pagina = 1;
    IF @tamanoPagina < 1 SET @tamanoPagina = 10;
    IF @tamanoPagina > 100 SET @tamanoPagina = 100;

    SELECT 
        id,
        nombre,
        email,
        celular,
        estado,
        fechaCreacion,
        COUNT(*) OVER() AS totalregistros
    FROM Proveedor WITH (NOLOCK)
    WHERE (@proveedor IS NULL OR @proveedor = '' OR nombre LIKE '%' + @proveedor + '%')
    ORDER BY id ASC
    OFFSET (@pagina - 1) * @tamanoPagina ROWS
    FETCH NEXT @tamanoPagina ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE spBuscarProductos
    @producto VARCHAR(80) = '',
    @pagina INT = 1,
    @tamanoPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalización de paginación
    IF @pagina < 1 SET @pagina = 1;
    IF @tamanoPagina < 1 SET @tamanoPagina = 10;
    IF @tamanoPagina > 100 SET @tamanoPagina = 100;

    SELECT 
        p.id AS idProducto,
        p.codigo,
        p.nombre AS producto,
        ISNULL(c.categoria, 'Sin Categoría') AS categoria,
        pxp.NumeroLote AS numerolote,
        pr.id AS idProveedor,
        pr.nombre AS proveedor,
        inv.costoProducto,
        inv.precioProducto,
        inv.stockProducto,
        p.estado,
        p.fechaCreacion,
        COUNT(*) OVER() AS totalregistros
    FROM Producto p WITH (NOLOCK)
    LEFT JOIN CategoriaProducto c WITH (NOLOCK) ON c.id = p.idCategoria
    INNER JOIN ProveedorXProducto pxp WITH (NOLOCK) ON pxp.idProducto = p.id
    INNER JOIN Proveedor pr WITH (NOLOCK) ON pxp.idProveedor = pr.id 
    INNER JOIN Inventario inv WITH (NOLOCK) ON inv.idLote = pxp.id
    WHERE (@producto IS NULL OR @producto = '' OR p.nombre LIKE '%' + @producto + '%' OR p.codigo LIKE '%' + @producto + '%')
    ORDER BY p.id ASC, pxp.NumeroLote ASC                        
    OFFSET (@pagina - 1) * @tamanoPagina ROWS
    FETCH NEXT @tamanoPagina ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE spReporteProductosPrecios
    @producto VARCHAR(80) = ''
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ColumnasPivot NVARCHAR(MAX) = '';
    DECLARE @ColumnasSelect NVARCHAR(MAX) = '';
    DECLARE @Sql NVARCHAR(MAX) = '';

    -- 1. Concatenar los nombres de los proveedores activos entre corchetes
    SELECT 
        @ColumnasPivot = STRING_AGG(QUOTENAME(nombre), ',') WITHIN GROUP (ORDER BY id ASC),
        @ColumnasSelect = STRING_AGG('ISNULL(' + QUOTENAME(nombre) + ', 0.00) AS ' + QUOTENAME('Precio ' + nombre), ', ') WITHIN GROUP (ORDER BY id ASC)
    FROM Proveedor
    WHERE estado = 1;

    -- Validar si existen proveedores registrados
    IF @ColumnasPivot IS NULL OR @ColumnasPivot = ''
    BEGIN
        RAISERROR('No existen proveedores activos para generar el reporte.', 16, 1);
        RETURN;
    END

    -- 2. Ensamblar la consulta con la cláusula PIVOT
    SET @Sql = N'
    SELECT 
        Producto,
        ' + @ColumnasSelect + N'
    FROM (
        SELECT 
            p.nombre AS Producto,
            pr.nombre AS Proveedor,
            inv.precioProducto
        FROM Producto p WITH (NOLOCK)
        INNER JOIN ProveedorXProducto pxp WITH (NOLOCK) ON pxp.idProducto = p.id
        INNER JOIN Proveedor pr WITH (NOLOCK) ON pxp.idProveedor = pr.id
        INNER JOIN Inventario inv WITH (NOLOCK) ON inv.idLote = pxp.id
        WHERE p.estado = 1
          AND (@filtro = '''' OR p.nombre LIKE ''%'' + @filtro + ''%'')
    ) AS Fuente
    PIVOT (
        MAX(precioProducto)
        FOR Proveedor IN (' + @ColumnasPivot + N')
    ) AS PivotTable
    ORDER BY Producto ASC;';

    -- 3. Ejecutar de forma segura pasando el parámetro de filtro
    EXEC sp_executesql 
        @stmt = @Sql, 
        @params = N'@filtro VARCHAR(80)', 
        @filtro = @producto;
END;
GO

-- CRUDs

-- C Producto

CREATE OR ALTER PROCEDURE spCrearProducto
    -- Datos del Producto
    @codigo VARCHAR(4),
    @nombre VARCHAR(80),
    @descripcion VARCHAR(200) = NULL,
    @idCategoria INT = NULL,

    -- Datos de la Relación / Lote
    @idProveedor INT,
    @numeroLote VARCHAR(11), -- Formato esperado: 'LOT-NNNN-PP'

    -- Datos de Inventario Inicial
    @costoProducto DECIMAL(18,2) = 0.00,
    @precioProducto DECIMAL(18,2) = 0.00,
    @stockProducto INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Normalización de cadenas
    SET @codigo = UPPER(LTRIM(RTRIM(@codigo)));
    SET @nombre = LTRIM(RTRIM(@nombre));
    SET @numeroLote = UPPER(LTRIM(RTRIM(@numeroLote)));

    -- 2. Validaciones obligatorias de negocio
    IF @codigo IS NULL OR @codigo = ''
    BEGIN
        RAISERROR('El código del producto es obligatorio (máximo 4 caracteres).', 16, 1);
        RETURN;
    END

    IF @nombre IS NULL OR @nombre = ''
    BEGIN
        RAISERROR('El nombre del producto es obligatorio.', 16, 1);
        RETURN;
    END

    IF @idProveedor IS NULL OR NOT EXISTS (SELECT 1 FROM Proveedor WHERE id = @idProveedor AND estado = 1)
    BEGIN
        RAISERROR('El proveedor especificado no existe o está inactivo.', 16, 1);
        RETURN;
    END

    IF @numeroLote IS NULL OR @numeroLote = ''
    BEGIN
        RAISERROR('El número de lote es obligatorio.', 16, 1);
        RETURN;
    END

    IF @stockProducto < 0
    BEGIN
        RAISERROR('El stock inicial no puede ser un valor negativo.', 16, 1);
        RETURN;
    END

    IF @costoProducto < 0 OR @precioProducto < 0
    BEGIN
        RAISERROR('El costo y el precio de venta no pueden ser negativos.', 16, 1);
        RETURN;
    END

    -- 3. Validar unicidad del código de producto
    IF EXISTS (SELECT 1 FROM Producto WHERE codigo = @codigo)
    BEGIN
        RAISERROR('Ya existe un producto registrado con el código ingresado.', 16, 1);
        RETURN;
    END

    -- 4. Validar categoría si fue enviada
    IF @idCategoria IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CategoriaProducto WHERE id = @idCategoria AND estado = 1)
    BEGIN
        RAISERROR('La categoría especificada no existe o está inactiva.', 16, 1);
        RETURN;
    END

    -- Variables para capturar IDs generados
    DECLARE @nuevoIdProducto INT;
    DECLARE @nuevoIdLote INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Paso 1: Insertar en Producto
        INSERT INTO Producto (codigo, nombre, descripcion, idCategoria, estado, fechaCreacion)
        VALUES (@codigo, @nombre, @descripcion, @idCategoria, 1, GETDATE());

        SET @nuevoIdProducto = SCOPE_IDENTITY();

        -- Paso 2: Insertar en ProveedorXProducto
        INSERT INTO ProveedorXProducto (NumeroLote, idProveedor, idProducto, estado, fechaCreacion)
        VALUES (@numeroLote, @idProveedor, @nuevoIdProducto, 1, GETDATE());

        SET @nuevoIdLote = SCOPE_IDENTITY();

        -- Paso 3: Insertar en Inventario
        INSERT INTO Inventario (idLote, costoProducto, precioProducto, stockProducto, fechaCreacion, fechaActualizacion)
        VALUES (@nuevoIdLote, @costoProducto, @precioProducto, @stockProducto, GETDATE(), GETDATE());

        COMMIT TRANSACTION;

        -- Retornar confirmación y datos generados
        SELECT 
            @nuevoIdProducto AS IdProducto,
            @nuevoIdLote AS IdProveedorProducto,
            @codigo AS Codigo,
            @nombre AS Nombre,
            @numeroLote AS NumeroLote,
            @precioProducto AS PrecioVenta,
            @stockProducto AS Stock,
            'Producto e inventario inicial creados correctamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- U Productos
CREATE OR ALTER PROCEDURE spActualizarProducto
    @idProducto INT,
    @nombre VARCHAR(80),
    @descripcion VARCHAR(200) = NULL,
    @idCategoria INT = NULL,
    @estado BIT = 1,

    -- Parámetros opcionales para actualizar un lote/inventario existente
    @idProveedorProducto INT = NULL, -- ID de la tabla ProveedorXProducto
    @costoProducto DECIMAL(18,2) = NULL,
    @precioProducto DECIMAL(18,2) = NULL,
    @stockProducto INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Normalización de entradas
    SET @nombre = LTRIM(RTRIM(@nombre));

    -- 2. Validaciones básicas
    IF @idProducto IS NULL OR NOT EXISTS (SELECT 1 FROM Producto WHERE id = @idProducto)
    BEGIN
        RAISERROR('El producto especificado no existe.', 16, 1);
        RETURN;
    END

    IF @nombre IS NULL OR @nombre = ''
    BEGIN
        RAISERROR('El nombre del producto no puede estar vacío.', 16, 1);
        RETURN;
    END

    -- Validar categoría si no es nula
    IF @idCategoria IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CategoriaProducto WHERE id = @idCategoria AND estado = 1)
    BEGIN
        RAISERROR('La categoría especificada no existe o está inactiva.', 16, 1);
        RETURN;
    END

    -- Validar inventario si se envió un lote a actualizar
    IF @idProveedorProducto IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ProveedorXProducto WHERE id = @idProveedorProducto AND idProducto = @idProducto)
        BEGIN
            RAISERROR('El lote especificado no corresponde al producto.', 16, 1);
            RETURN;
        END

        IF @stockProducto IS NOT NULL AND @stockProducto < 0
        BEGIN
            RAISERROR('El stock no puede ser negativo.', 16, 1);
            RETURN;
        END

        IF (@costoProducto IS NOT NULL AND @costoProducto < 0) OR (@precioProducto IS NOT NULL AND @precioProducto < 0)
        BEGIN
            RAISERROR('El costo o precio de venta no pueden ser negativos.', 16, 1);
            RETURN;
        END
    END

    -- 3. Proceso transaccional
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Paso 1: Actualizar catálogo del producto
        UPDATE Producto
        SET 
            nombre = @nombre,
            descripcion = @descripcion,
            idCategoria = @idCategoria,
            estado = @estado
        WHERE id = @idProducto;

        -- Paso 2: Actualizar lote e inventario (si se enviaron valores)
        IF @idProveedorProducto IS NOT NULL
        BEGIN
            UPDATE Inventario
            SET 
                costoProducto = ISNULL(@costoProducto, costoProducto),
                precioProducto = ISNULL(@precioProducto, precioProducto),
                stockProducto = ISNULL(@stockProducto, stockProducto),
                fechaActualizacion = GETDATE()
            WHERE idLote = @idProveedorProducto;
        END

        COMMIT TRANSACTION;

        -- Retornar resultado actualizado
        SELECT 
            p.id AS IdProducto,
            p.codigo AS Codigo,
            p.nombre AS Nombre,
            p.descripcion AS Descripcion,
            p.idCategoria AS IdCategoria,
            p.estado AS Estado,
            'Producto actualizado correctamente.' AS Mensaje
        FROM Producto p
        WHERE p.id = @idProducto;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- D Producto
USE Prueba;
GO

CREATE OR ALTER PROCEDURE spEliminarProducto
    @idProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validación de existencia
    IF @idProducto IS NULL OR NOT EXISTS (SELECT 1 FROM Producto WHERE id = @idProducto)
    BEGIN
        RAISERROR('El producto especificado no existe.', 16, 1);
        RETURN;
    END

    -- 2. Validación de estado actual
    IF EXISTS (SELECT 1 FROM Producto WHERE id = @idProducto AND estado = 0)
    BEGIN
        RAISERROR('El producto ya se encuentra inactivo.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Paso 1: Baja lógica del producto
        UPDATE Producto
        SET estado = 0
        WHERE id = @idProducto;

        -- Paso 2: Baja lógica de las relaciones de proveedor y lotes asociadas
        UPDATE ProveedorXProducto
        SET estado = 0
        WHERE idProducto = @idProducto AND estado = 1;

        -- Paso 3: Actualizar fecha de auditoría en los inventarios vinculados
        UPDATE inv
        SET inv.fechaActualizacion = GETDATE()
        FROM Inventario inv
        INNER JOIN ProveedorXProducto pxp ON inv.idLote = pxp.id
        WHERE pxp.idProducto = @idProducto;

        COMMIT TRANSACTION;

        -- Retorno de confirmación
        SELECT 
            @idProducto AS IdProducto,
            0 AS Estado,
            'Producto y sus lotes asociados han sido desactivados exitosamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- C Proveedores
CREATE OR ALTER PROCEDURE spCrearProveedores
    @nombre VARCHAR(80),
    @email VARCHAR(50),
    @celular VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Limpieza de espacios
    SET @nombre = LTRIM(RTRIM(@nombre));
    SET @email = LOWER(LTRIM(RTRIM(@email)));
    SET @celular = LTRIM(RTRIM(@celular));

    -- 2. Validaciones obligatorias
    IF @nombre IS NULL OR @nombre = ''
    BEGIN
        RAISERROR('El nombre del proveedor es obligatorio.', 16, 1);
        RETURN;
    END

    IF @email IS NULL OR @email = ''
    BEGIN
        RAISERROR('El correo electrónico es obligatorio.', 16, 1);
        RETURN;
    END

    -- Validación básica de formato de email
    IF @email NOT LIKE '%_@__%.__%'
    BEGIN
        RAISERROR('El formato del correo electrónico no es válido.', 16, 1);
        RETURN;
    END

    -- 3. Validar duplicados (por nombre o correo)
    IF EXISTS (SELECT 1 FROM Proveedor WHERE LOWER(email) = @email)
    BEGIN
        RAISERROR('Ya existe un proveedor registrado con el correo electrónico ingresado.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Proveedor WHERE LOWER(nombre) = LOWER(@nombre))
    BEGIN
        RAISERROR('Ya existe un proveedor registrado con ese nombre.', 16, 1);
        RETURN;
    END

    -- 4. Inserción con manejo de errores
    BEGIN TRY
        INSERT INTO Proveedor (nombre, email, celular, estado, fechaCreacion)
        VALUES (@nombre, @email, @celular, 1, GETDATE());

        DECLARE @nuevoId INT = SCOPE_IDENTITY();

        -- Retornar el registro recién creado
        SELECT 
            id,
            nombre,
            email,
            celular,
            estado,
            fechaCreacion,
            'Proveedor registrado exitosamente.' AS mensaje
        FROM Proveedor
        WHERE id = @nuevoId;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- U Proveedores
CREATE OR ALTER PROCEDURE spCrearProveedores
    @nombre VARCHAR(80),
    @email VARCHAR(50),
    @celular VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Limpieza de espacios
    SET @nombre = LTRIM(RTRIM(@nombre));
    SET @email = LOWER(LTRIM(RTRIM(@email)));
    SET @celular = LTRIM(RTRIM(@celular));

    -- 2. Validaciones obligatorias
    IF @nombre IS NULL OR @nombre = ''
    BEGIN
        RAISERROR('El nombre del proveedor es obligatorio.', 16, 1);
        RETURN;
    END

    IF @email IS NULL OR @email = ''
    BEGIN
        RAISERROR('El correo electrónico es obligatorio.', 16, 1);
        RETURN;
    END

    -- Validación básica de formato de email
    IF @email NOT LIKE '%_@__%.__%'
    BEGIN
        RAISERROR('El formato del correo electrónico no es válido.', 16, 1);
        RETURN;
    END

    -- 3. Validar duplicados (por nombre o correo)
    IF EXISTS (SELECT 1 FROM Proveedor WHERE LOWER(email) = @email)
    BEGIN
        RAISERROR('Ya existe un proveedor registrado con el correo electrónico ingresado.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Proveedor WHERE LOWER(nombre) = LOWER(@nombre))
    BEGIN
        RAISERROR('Ya existe un proveedor registrado con ese nombre.', 16, 1);
        RETURN;
    END

    -- 4. Inserción con manejo de errores
    BEGIN TRY
        INSERT INTO Proveedor (nombre, email, celular, estado, fechaCreacion)
        VALUES (@nombre, @email, @celular, 1, GETDATE());

        DECLARE @nuevoId INT = SCOPE_IDENTITY();

        -- Retornar el registro recién creado
        SELECT 
            id,
            nombre,
            email,
            celular,
            estado,
            fechaCreacion,
            'Proveedor registrado exitosamente.' AS mensaje
        FROM Proveedor
        WHERE id = @nuevoId;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- D Proveedor

CREATE OR ALTER PROCEDURE spEliminarProveedor
    @idProveedor INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validar existencia del proveedor
    IF @idProveedor IS NULL OR NOT EXISTS (SELECT 1 FROM Proveedor WHERE id = @idProveedor)
    BEGIN
        RAISERROR('El proveedor especificado no existe.', 16, 1);
        RETURN;
    END

    -- 2. Validar si ya se encuentra inactivo
    IF EXISTS (SELECT 1 FROM Proveedor WHERE id = @idProveedor AND estado = 0)
    BEGIN
        RAISERROR('El proveedor ya se encuentra inactivo.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Paso 1: Baja lógica del proveedor
        UPDATE Proveedor
        SET estado = 0
        WHERE id = @idProveedor;

        -- Paso 2: Baja lógica de las relaciones con productos vinculadas a este proveedor
        UPDATE ProveedorXProducto
        SET estado = 0
        WHERE idProveedor = @idProveedor AND estado = 1;

        COMMIT TRANSACTION;

        -- Retornar confirmación
        SELECT 
            @idProveedor AS idProveedor,
            0 AS estado,
            'Proveedor y sus relaciones de productos asociadas han sido desactivados exitosamente.' AS mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO
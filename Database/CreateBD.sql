CREATE DATABASE Prueba
GO
USE Prueba
GO
CREATE TABLE Roles(
    id INT IDENTITY(1,1) PRIMARY KEY,
    rol VARCHAR(20) NOT NULL,
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE()

)

CREATE TABLE Usuario(
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    usuario varchar(10) NOT NULL UNIQUE,
    email varchar(50) NOT NULL,
    contrasenaHash VARCHAR(255) NOT NULL, 
    rol INT NOT NULL,
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FKRolU FOREIGN KEY (rol) REFERENCES Roles(id)

);

CREATE TABLE Rutas(
    id INT IDENTITY(1,1) PRIMARY KEY,
    idRol INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    ruta VARCHAR(80) NOT NULL,
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FKRol FOREIGN KEY (idRol) REFERENCES Roles(id)

)

CREATE TABLE Proveedor (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    email varchar(50) NOT NULL,
    celular VARCHAR(10),
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
);


CREATE TABLE CategoriaProducto(
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoria VARCHAR(30) NOT NULL UNIQUE,
    estado BIT NOT NULL DEFAULT 1
);

CREATE TABLE Producto(
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(4) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(200),
    idCategoria INT,
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FKCategoria FOREIGN KEY (idCategoria) REFERENCES CategoriaProducto(id)
        

);

CREATE TABLE ProveedorXProducto(
    id INT IDENTITY(1,1) PRIMARY KEY,
    NumeroLote VARCHAR(11) UNIQUE, --LOT-NNNN-PP
    idProveedor INT NOT NULL,
    idProducto INT NOT NULL,
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FKProveedor FOREIGN KEY (idProveedor) REFERENCES Proveedor(id),
    CONSTRAINT FKProducto FOREIGN KEY (idProducto) REFERENCES Producto(id),
);

CREATE TABLE Inventario(
    id INT IDENTITY(1,1) PRIMARY KEY,
    idLote INT NOT NULL,
    costoProducto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    precioProducto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    stockProducto INT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    fechaActualizacion DATETIME  NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FKLote FOREIGN KEY (idLote) REFERENCES ProveedorXProducto(id),
);

CREATE TABLE Auditoria (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idUsuario INT NULL,
    usuario VARCHAR(80) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    detalle VARCHAR(500) NOT NULL,
    ip VARCHAR(45) NULL,
    fecha DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FKAuditoriaUsuario FOREIGN KEY (idUsuario) REFERENCES Usuario(id)
);

GO

-- Índices de consulta rápida
CREATE INDEX IXProductoCodigo ON Producto(codigo);
CREATE INDEX IXInventarioPxP ON Inventario(idLote);
CREATE INDEX IXAuditoriaFecha ON Auditoria(fecha DESC);
CREATE INDEX IXAuditoriaUsuario ON Auditoria(usuario);
GO

-- INSERTS 

-- =======================================================
-- 1. ROLES (Administrador, Operador, Soporte)
-- =======================================================
INSERT INTO Roles (rol, estado)
VALUES 
('Administrador', 1), -- id: 1
('Operador', 1),      -- id: 2
('Soporte', 1);       -- id: 3
GO

-- =======================================================
-- 2. USUARIOS
-- Hash BCrypt válido para la contraseña: Admin123*
-- =======================================================
INSERT INTO Usuario (nombres, apellidos, usuario, email, contrasenaHash, rol)
VALUES 
('Carlos', 'Mendoza', 'admin', 'admin@prueba.com', '$2a$11$ie6g.6Y8JxEu3w9undaGr.npgr0icjEO23SMrUVqrw6l7exjulxHi', 1),
('Laura', 'Paredes', 'operador1', 'operador@prueba.com', '$2a$11$ie6g.6Y8JxEu3w9undaGr.npgr0icjEO23SMrUVqrw6l7exjulxHi', 2),
('Andrés', 'Torres', 'soporte', 'soporte@prueba.com', '$2a$11$ie6g.6Y8JxEu3w9undaGr.npgr0icjEO23SMrUVqrw6l7exjulxHi', 3);
GO

-- =======================================================
-- 3. RUTAS (Permisos de navegación para Angular)
-- =======================================================
INSERT INTO Rutas (idRol, nombre, ruta, estado)
VALUES 
-- Rutas Administrador (Acceso total)
(1, 'Dashboard', '/dashboard', 1),
(1, 'Gestión de Productos', '/productos', 1),
(1, 'Gestión de Proveedores', '/proveedores', 1),
(1, 'Gestión de Inventario', '/inventario', 1),
(1, 'Gestión de Usuarios', '/usuarios', 1),
(1, 'Visor de Logs', '/logs', 1),
(1, 'Reporte de Precios', '/reportes/precios', 1),

-- Rutas Operador / Proveedor (Consulta de productos, stock y reporte de precios)
(2, 'Dashboard', '/dashboard', 1),
(2, 'Consulta de Productos', '/productos', 1),
(2, 'Control de Stock', '/inventario', 1),
(2, 'Reporte de Precios', '/reportes/precios', 1),

-- Rutas Soporte (Administración de usuarios y Visor de logs del sistema)
(3, 'Dashboard', '/dashboard', 1),
(3, 'Gestión de Usuarios', '/usuarios', 1),
(3, 'Visor de Logs', '/logs', 1);
GO

-- =======================================================
-- 4. PROVEEDORES
-- =======================================================
INSERT INTO Proveedor (nombre, email, celular, estado)
VALUES 
('Proveedor A', 'contacto@proveedora.com', '0991112233', 1), -- id: 1
('Proveedor B', 'ventas@proveedorb.com', '0982223344', 1),   -- id: 2
('Proveedor N', 'distribucion@proveedorn.com', '0973334455', 1); -- id: 3
GO

-- =======================================================
-- 5. CATEGORIAS DE PRODUCTO
-- =======================================================
INSERT INTO CategoriaProducto (categoria, estado)
VALUES 
('Video y Pantallas', 1), -- id: 1
('Sistemas de Audio', 1),  -- id: 2
('Consumo General', 1);    -- id: 3
GO

-- =======================================================
-- 6. PRODUCTOS (Codigos <= 4 caracteres)
-- =======================================================
INSERT INTO Producto (codigo, nombre, descripcion, idCategoria, estado)
VALUES 
('M050', 'Monitor 50 pulgadas 4K', 'Monitor Ultra HD 4K panel IPS 60Hz', 1, 1), -- id: 1
('S020', 'Equipo de Sonido 20000', 'Sistema de sonido estéreo 20000W PMPO', 2, 1), -- id: 2
('P00N', 'Producto N', 'Artículo de catálogo general de alta rotación', 3, 1);    -- id: 3
GO

-- =======================================================
-- 7. PROVEEDOR X PRODUCTO (NumeroLote VARCHAR(11) UNIQUE)
-- Formato: LOT-NNNN-PP
-- =======================================================
INSERT INTO ProveedorXProducto (NumeroLote, idProveedor, idProducto, estado)
VALUES 
-- Monitor 50 pulgadas 4K (idProducto: 1)
('LOT-0001-01', 1, 1, 1), -- Proveedor A (id: 1)
('LOT-0001-02', 2, 1, 1), -- Proveedor B (id: 2)
('LOT-0001-03', 3, 1, 1), -- Proveedor N (id: 3)

-- Equipo de Sonido 20000 (idProducto: 2)
('LOT-0002-01', 1, 2, 1), -- Proveedor A (id: 4)
('LOT-0002-02', 2, 2, 1), -- Proveedor B (id: 5)
('LOT-0002-03', 3, 2, 1), -- Proveedor N (id: 6)

-- Producto N (idProducto: 3)
('LOT-0003-01', 1, 3, 1), -- Proveedor A (id: 7)
('LOT-0003-02', 2, 3, 1), -- Proveedor B (id: 8)
('LOT-0003-03', 3, 3, 1); -- Proveedor N (id: 9)
GO

-- =======================================================
-- 8. INVENTARIO (Precios y stock del challenge)
-- =======================================================
INSERT INTO Inventario (idLote, costoProducto, precioProducto, stockProducto)
VALUES 
-- Monitor 50: Prov A $250 | Prov B $300 | Prov N $200
(1, 180.00, 250.00, 15),
(2, 210.00, 300.00, 10),
(3, 140.00, 200.00, 25),

-- Sonido 20000: Prov A $150 | Prov B $200 | Prov N $100
(4, 110.00, 150.00, 12),
(5, 150.00, 200.00, 8),
(6, 70.00,  100.00, 30),

-- Producto N: Prov A $400 | Prov B $600 | Prov N $350
(7, 280.00, 400.00, 20),
(8, 450.00, 600.00, 6),
(9, 230.00, 350.00, 18);
GO

-- =======================================================
-- 9. AUDITORÍA INICIAL (Trazabilidad de acciones de usuarios)
-- =======================================================
INSERT INTO Auditoria (idUsuario, usuario, rol, accion, modulo, detalle, ip, fecha)
VALUES 
(1, 'admin', 'Administrador', 'LOGIN', 'Autenticación', 'Inicio de sesión exitoso del administrador Carlos Mendoza.', '127.0.0.1', DATEADD(MINUTE, -120, GETDATE())),
(1, 'admin', 'Administrador', 'CREAR_PRODUCTO', 'Productos', 'Registro inicial de producto M50 - Monitor 50 pulgadas 4K con lote LOT-0001-01.', '127.0.0.1', DATEADD(MINUTE, -115, GETDATE())),
(1, 'admin', 'Administrador', 'CREAR_PROVEEDOR', 'Proveedores', 'Alta de nuevo proveedor "Proveedor A" (contacto@proveedora.com).', '127.0.0.1', DATEADD(MINUTE, -110, GETDATE())),
(2, 'operador1', 'Operador', 'LOGIN', 'Autenticación', 'Inicio de sesión del operador Laura Paredes.', '127.0.0.1', DATEADD(MINUTE, -90, GETDATE())),
(2, 'operador1', 'Operador', 'ACTUALIZAR_STOCK', 'Inventario', 'Ajuste de inventario en lote LOT-0001-01 (+15 unidades).', '127.0.0.1', DATEADD(MINUTE, -85, GETDATE())),
(3, 'soporte', 'Soporte', 'LOGIN', 'Autenticación', 'Inicio de sesión del usuario de soporte Andrés Torres.', '127.0.0.1', DATEADD(MINUTE, -30, GETDATE())),
(3, 'soporte', 'Soporte', 'CONSULTA_LOGS', 'Auditoría', 'Consulta y verificación de trazas de eventos del servidor.', '127.0.0.1', DATEADD(MINUTE, -25, GETDATE()));
GO
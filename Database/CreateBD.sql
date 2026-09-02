CREATE DATABASE Prueba
GO
USE Prueba
GO
CREATE TABLE Usuario(
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    usuario varchar(10) NOT NULL UNIQUE,
    email varchar(50) NOT NULL,
    contrasenaHash VARCHAR(255) NOT NULL, 
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Administrador', 'Operador', 'Proveedor')),
    fechaCreacion DATETIME DEFAULT GETDATE()

);
CREATE TABLE Proveedor (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    email varchar(50) NOT NULL,
    celular VARCHAR(10),
    estado BIT NOT NULL DEFAULT 1,
    fechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
)


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
    NumeroLote VARCHAR(11) NOT NULL UNIQUE, --LOT-NNNN-PP
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

GO

-- Índices de consulta rápida
CREATE INDEX IXProductoCodigo ON Producto(codigo);
CREATE INDEX IXInventarioPxP ON Inventario(idLote);
GO
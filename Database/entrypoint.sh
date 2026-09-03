#!/bin/bash
set -e

# Iniciar SQL Server en segundo plano
/opt/mssql/bin/sqlservr &
pid=$!

echo "Iniciando SQL Server 2022... Esperando disponibilidad del motor de base de datos..."

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD" ]; then
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

for i in {1..60}; do
    if $SQLCMD -S 127.0.0.1,1433 -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server conectado exitosamente."
        
        # Verificar si la tabla Usuario ya existe en la base de datos Prueba
        DB_EXISTS=$($SQLCMD -S 127.0.0.1,1433 -U sa -P "$MSSQL_SA_PASSWORD" -C -h -1 -Q "SET NOCOUNT ON; IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'Prueba') AND EXISTS (SELECT 1 FROM Prueba.sys.tables WHERE name = 'Usuario') SELECT 1 ELSE SELECT 0" 2>/dev/null || echo "0")
        
        if [ "$DB_EXISTS" = "1" ]; then
            echo "La base de datos 'Prueba' y sus tablas ya se encuentran inicializadas."
        else
            echo "Ejecutando CreateBD.sql para inicializar esquema relacional..."
            $SQLCMD -S 127.0.0.1,1433 -U sa -P "$MSSQL_SA_PASSWORD" -C -i /usr/src/app/CreateBD.sql
            echo "Ejecutando CreateSP.sql para crear procedimientos almacenados..."
            $SQLCMD -S 127.0.0.1,1433 -U sa -P "$MSSQL_SA_PASSWORD" -C -i /usr/src/app/CreateSP.sql
            echo "Base de datos 'Prueba' y Procedimientos Almacenados configurados con exito."
        fi
        break
    fi
    echo "Esperando que SQL Server acepte conexiones ($i/60)..."
    sleep 2
done

# Mantener proceso de SQL Server en primer plano
wait $pid

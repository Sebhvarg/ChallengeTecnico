#!/bin/bash
set -e

# Iniciar SQL Server en segundo plano
/opt/mssql/bin/sqlservr &
pid=$!

echo "Iniciando SQL Server... Esperando disponibilidad para ejecutar scripts de base de datos..."

# Herramienta sqlcmd (en mssql 2022 está en /opt/mssql-tools18/bin/sqlcmd o /opt/mssql-tools/bin/sqlcmd)
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD" ]; then
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

for i in {1..50}; do
    if $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server conectado exitosamente."
        
        # Verificar si la base de datos Prueba ya tiene tablas creadas
        DB_EXISTS=$($SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -h -1 -Q "SET NOCOUNT ON; IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Usuario') SELECT 1 ELSE SELECT 0" -d Prueba 2>/dev/null || echo "0")
        
        if [ "$DB_EXISTS" = "1" ]; then
            echo "La base de datos 'Prueba' ya se encuentra inicializada."
        else
            echo "Ejecutando CreateBD.sql..."
            $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /usr/src/app/CreateBD.sql
            echo "Ejecutando CreateSP.sql..."
            $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /usr/src/app/CreateSP.sql
            echo "¡Base de datos 'Prueba' y Procedimientos Almacenados creados exitosamente!"
        fi
        break
    fi
    echo "Esperando que SQL Server acepte conexiones ($i/50)..."
    sleep 2
done

# Esperar proceso de SQL Server
wait $pid

#!/usr/bin/env bash
set -eu

DB_HOST="${DB_HOST:-db}"
SA_PASSWORD="${SA_PASSWORD:-Pass1234}"

SQLCMD_BIN=""
if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
  SQLCMD_BIN=/opt/mssql-tools18/bin/sqlcmd
elif [ -x /opt/mssql-tools/bin/sqlcmd ]; then
  SQLCMD_BIN=/opt/mssql-tools/bin/sqlcmd
else
  echo "sqlcmd not found in container"
  exit 1
fi

sqlcmd() {
  "$SQLCMD_BIN" -S "$DB_HOST" -U sa -P "$SA_PASSWORD" -C "$@"
}

echo "Waiting for SQL Server at ${DB_HOST}..."
i=0
while [ "$i" -lt 60 ]; do
  if sqlcmd -Q "SELECT 1" >/dev/null 2>&1; then
    echo "SQL Server is ready."
    break
  fi
  i=$((i + 1))
  sleep 2
done

if ! sqlcmd -Q "SELECT 1" >/dev/null 2>&1; then
  echo "SQL Server is not available."
  exit 1
fi

DB_EXISTS="$(sqlcmd -Q "SET NOCOUNT ON; SELECT CASE WHEN DB_ID('Autosalon') IS NOT NULL THEN 1 ELSE 0 END" -h -1 -W | tr -d '[:space:]')"

if [ "$DB_EXISTS" != "1" ]; then
  echo "Database Autosalon not found - running full init script..."
  sqlcmd -i /init/database_full_script.sql
  echo "Database Autosalon created."
else
  echo "Database Autosalon already exists - skipping full init."
fi

echo "Ensuring chat tables..."
sqlcmd -d Autosalon -i /init/chat_tables.sql

echo "Ensuring catalog columns..."
sqlcmd -d Autosalon -i /init/catalog_columns.sql

echo "Database initialization finished successfully."

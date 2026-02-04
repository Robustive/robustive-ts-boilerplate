#!/bin/bash
set -e

# ユーザの作成
# $POSTGRES_USER は指定していない場合、"postgres"
# $POSTGRES_DB は指定していない場合、POSTGRES_USER と同じ
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER inspectoruser WITH PASSWORD 'inspectorP@ssw0rd';
	CREATE DATABASE inspectordb;
	GRANT ALL PRIVILEGES ON DATABASE inspectordb TO inspectoruser;
EOSQL

# テーブルの作成
psql --username "$POSTGRES_USER" inspectordb < /sqls/init.sql


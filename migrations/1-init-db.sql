-- Add extension to generate UUIDs
create extension if not exists "uuid-ossp";

-- Add timescaleDB
create extension if not exists "timescaledb";

-- Create schema for api resources
create schema if not exists api;
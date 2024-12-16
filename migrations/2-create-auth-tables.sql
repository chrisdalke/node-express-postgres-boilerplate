set search_path to api;

-- Auth tokens
create table tokens (
    id varchar primary key,
    created_at timestamptz not null default now()
);
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    contract_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('evm', 'pvm')),
    deployer TEXT NOT NULL,
    model TEXT NOT NULL,
    modules JSONB NOT NULL DEFAULT '[]',
    merkle_root TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    registry_tx_hash TEXT,
    source TEXT,
    abi JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cached_contracts (
    id SERIAL PRIMARY KEY,
    chain TEXT NOT NULL,
    address TEXT NOT NULL,
    source TEXT,
    abi JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(chain, address)
);

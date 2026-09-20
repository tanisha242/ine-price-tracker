CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sku TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    brand TEXT,

    category TEXT,

    product_url TEXT NOT NULL UNIQUE,

    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tracked_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tracked_product_id UUID NOT NULL
        REFERENCES tracked_products(id)
        ON DELETE CASCADE,

    price NUMERIC(12,2) NOT NULL,

    stock_status TEXT NOT NULL,

    stock_quantity INTEGER,

    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tracked_product_id UUID NOT NULL
        REFERENCES tracked_products(id)
        ON DELETE CASCADE,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    attempt INTEGER NOT NULL,

    status TEXT NOT NULL
        CHECK (
            status IN (
                'SUCCESS',
                'RETRIED',
                'FAILED'
            )
        ),

    error_type TEXT,

    error_message TEXT,

    http_status INTEGER,

    extracted_price NUMERIC(12,2),

    extracted_stock TEXT,

    extracted_stock_quantity INTEGER,

    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_products_name
ON products USING gin (
    to_tsvector('english', name)
);


CREATE INDEX IF NOT EXISTS idx_price_history_product
ON price_history (
    tracked_product_id,
    scraped_at DESC
);


CREATE INDEX IF NOT EXISTS idx_scrape_logs_product
ON scrape_logs (
    tracked_product_id,
    started_at DESC
);


CREATE INDEX IF NOT EXISTS idx_tracked_products_active
ON tracked_products (
    is_active
);
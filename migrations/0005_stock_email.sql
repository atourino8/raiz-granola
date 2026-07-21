-- Migración 0005 · stock e email de cliente
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT -1;  -- -1 = ilimitado
ALTER TABLE orders ADD COLUMN customer_email TEXT;

-- Script de migración para PostgreSQL

-- 1. Crear la nueva tabla productos_gasto
CREATE TABLE IF NOT EXISTS productos_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    categoria_gasto_id UUID NOT NULL REFERENCES categorias_gasto(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar los productos únicos existentes desde la tabla de gastos
INSERT INTO productos_gasto (nombre, categoria_gasto_id, empresa_id)
SELECT DISTINCT nombre_producto, categoria_gasto_id, empresa_id
FROM gastos
WHERE nombre_producto IS NOT NULL AND nombre_producto != '';

-- 3. Añadir la columna producto_gasto_id a la tabla de gastos
ALTER TABLE gastos
ADD COLUMN producto_gasto_id UUID REFERENCES productos_gasto(id) ON DELETE SET NULL;

-- 4. Asociar los gastos existentes con sus nuevos productos en base al nombre y categoría
UPDATE gastos
SET producto_gasto_id = pg.id
FROM productos_gasto pg
WHERE gastos.nombre_producto = pg.nombre
  AND gastos.categoria_gasto_id = pg.categoria_gasto_id
  AND gastos.empresa_id = pg.empresa_id;

-- 5. Permitir que nombre_producto sea nulo, ya que de ahora en adelante usaremos producto_gasto_id
ALTER TABLE gastos ALTER COLUMN nombre_producto DROP NOT NULL;

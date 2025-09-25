-- Agregar columna ParaLlevar a pedidos
ALTER TABLE "pedidos" ADD COLUMN "ParaLlevar" BOOLEAN NOT NULL DEFAULT false;
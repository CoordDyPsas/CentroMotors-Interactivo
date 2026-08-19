-- DDL manual (sin sistema de migraciones). Aplicado en produccion vía:
--   npx wrangler d1 execute dyp-tracking --remote --file db/ot_historial.sql
CREATE TABLE IF NOT EXISTS ot_historial (
  branch TEXT NOT NULL,
  equipo_nro INTEGER NOT NULL,
  ot TEXT NOT NULL,
  agregado TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (branch, equipo_nro, ot)
);

/**
 * Listado de sectores de actividad compartido entre CompanyProfile y NewAnalysis.
 * Fuente única de verdad — no duplicar en otros archivos.
 */
export const SECTORES = [
  "Obras Civiles",
  "Energía",
  "Agua y Saneamiento",
  "Tecnología",
  "Sanidad",
  "Servicios Generales",
  "Industrial",
  "Transporte",
  "Telecomunicaciones",
  "Ambiental",
  "Arquitectura",
  "Facility Management",
] as const;

export type Sector = (typeof SECTORES)[number];

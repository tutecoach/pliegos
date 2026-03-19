/**
 * Claves centralizadas para React Query.
 * Única fuente de verdad para queryKey en toda la app.
 * Evita string literals dispersos y facilita la invalidación de caché.
 */
export const queryKeys = {
  // Perfil del usuario
  profile: (userId: string) => ["profile", userId] as const,

  // Empresa
  company: (companyId: string) => ["company", companyId] as const,
  companies: (userId: string) => ["companies", userId] as const,

  // Licitaciones
  tenders: (companyId: string) => ["tenders", companyId] as const,
  tender: (tenderId: string) => ["tender", tenderId] as const,
  tenderDocuments: (tenderId: string) => ["tender-documents", tenderId] as const,

  // Entidades de empresa
  companyCertifications: (companyId: string) => ["company-certifications", companyId] as const,
  companyExperience: (companyId: string) => ["company-experience", companyId] as const,
  companyTeam: (companyId: string) => ["company-team", companyId] as const,
  companyEquipment: (companyId: string) => ["company-equipment", companyId] as const,

  // Technical memories (para marcar si un tender ya tiene memoria)
  technicalMemories: (companyId: string) => ["technical-memories", companyId] as const,

  // Dashboard stats
  dashboardStats: (companyId: string) => ["dashboard-stats", companyId] as const,
  dashboardRecent: (companyId: string) => ["dashboard-recent", companyId] as const,

  // Informe de análisis
  analysisReport: (tenderId: string) => ["analysis-report", tenderId] as const,
} as const;

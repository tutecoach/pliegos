export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_reports: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          report_data: Json | null
          status: string
          tender_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_data?: Json | null
          status?: string
          tender_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_data?: Json | null
          status?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_reports_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          capacidad_economica: string | null
          capacidad_tecnica: string | null
          cif: string | null
          clasificacion_empresarial: string | null
          created_at: string
          deleted_at: string | null
          facturacion_anual: number | null
          id: string
          name: string
          patrimonio_neto: number | null
          phone: string | null
          sectores_actividad: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capacidad_economica?: string | null
          capacidad_tecnica?: string | null
          cif?: string | null
          clasificacion_empresarial?: string | null
          created_at?: string
          deleted_at?: string | null
          facturacion_anual?: number | null
          id?: string
          name: string
          patrimonio_neto?: number | null
          phone?: string | null
          sectores_actividad?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capacidad_economica?: string | null
          capacidad_tecnica?: string | null
          cif?: string | null
          clasificacion_empresarial?: string | null
          created_at?: string
          deleted_at?: string | null
          facturacion_anual?: number | null
          id?: string
          name?: string
          patrimonio_neto?: number | null
          phone?: string | null
          sectores_actividad?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_certifications: {
        Row: {
          company_id: string
          created_at: string
          fecha_obtencion: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string
          organismo_emisor: string | null
          puntuable: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          fecha_obtencion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          organismo_emisor?: string | null
          puntuable?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          fecha_obtencion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          organismo_emisor?: string | null
          puntuable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_experience: {
        Row: {
          cliente: string | null
          company_id: string
          created_at: string
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          importe: number | null
          resultado: string | null
          sector: string | null
          titulo: string
        }
        Insert: {
          cliente?: string | null
          company_id: string
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          importe?: number | null
          resultado?: string | null
          sector?: string | null
          titulo: string
        }
        Update: {
          cliente?: string | null
          company_id?: string
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          importe?: number | null
          resultado?: string | null
          sector?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_experience_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_team: {
        Row: {
          cargo: string | null
          certificaciones: string[] | null
          company_id: string
          created_at: string
          experiencia_anos: number | null
          id: string
          nombre: string
          sector_especialidad: string | null
          titulacion: string | null
        }
        Insert: {
          cargo?: string | null
          certificaciones?: string[] | null
          company_id: string
          created_at?: string
          experiencia_anos?: number | null
          id?: string
          nombre: string
          sector_especialidad?: string | null
          titulacion?: string | null
        }
        Update: {
          cargo?: string | null
          certificaciones?: string[] | null
          company_id?: string
          created_at?: string
          experiencia_anos?: number | null
          id?: string
          nombre?: string
          sector_especialidad?: string | null
          titulacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_team_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          demo_expires_at: string | null
          full_name: string | null
          id: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          demo_expires_at?: string | null
          full_name?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          demo_expires_at?: string | null
          full_name?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string
          display_name: string
          excluded_features: string[]
          features: string[]
          highlighted: boolean
          id: string
          is_published: boolean
          sort_order: number
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description: string
          display_name: string
          excluded_features?: string[]
          features?: string[]
          highlighted?: boolean
          id?: string
          is_published?: boolean
          sort_order?: number
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          excluded_features?: string[]
          features?: string[]
          highlighted?: boolean
          id?: string
          is_published?: boolean
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      technical_memories: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          sector: string | null
          status: string
          tender_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sector?: string | null
          status?: string
          tender_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sector?: string | null
          status?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_memories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_memories_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_criteria: {
        Row: {
          created_at: string
          descripcion: string
          formula: string | null
          id: string
          ponderacion: number | null
          tender_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          formula?: string | null
          id?: string
          ponderacion?: number | null
          tender_id: string
          tipo?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          formula?: string | null
          id?: string
          ponderacion?: number | null
          tender_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_criteria_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          tender_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tender_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tender_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_matching: {
        Row: {
          acciones_recomendadas: string | null
          brechas: string[] | null
          company_id: string
          created_at: string
          cumplimiento: string | null
          fortalezas: string[] | null
          iat_score: number | null
          id: string
          ire_score: number | null
          observaciones: string | null
          pea_score: number | null
          riesgo: string | null
          tender_id: string
        }
        Insert: {
          acciones_recomendadas?: string | null
          brechas?: string[] | null
          company_id: string
          created_at?: string
          cumplimiento?: string | null
          fortalezas?: string[] | null
          iat_score?: number | null
          id?: string
          ire_score?: number | null
          observaciones?: string | null
          pea_score?: number | null
          riesgo?: string | null
          tender_id: string
        }
        Update: {
          acciones_recomendadas?: string | null
          brechas?: string[] | null
          company_id?: string
          created_at?: string
          cumplimiento?: string | null
          fortalezas?: string[] | null
          iat_score?: number | null
          id?: string
          ire_score?: number | null
          observaciones?: string | null
          pea_score?: number | null
          riesgo?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_matching_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_matching_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_requirements_admin: {
        Row: {
          created_at: string
          descripcion: string
          id: string
          normativa_aplicable: string | null
          obligatorio: boolean | null
          riesgo_exclusion: string | null
          tender_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          id?: string
          normativa_aplicable?: string | null
          obligatorio?: boolean | null
          riesgo_exclusion?: string | null
          tender_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          id?: string
          normativa_aplicable?: string | null
          obligatorio?: boolean | null
          riesgo_exclusion?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_requirements_admin_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_requirements_tech: {
        Row: {
          created_at: string
          descripcion: string
          equipo_minimo: string | null
          experiencia_minima: string | null
          id: string
          medios_minimos: string | null
          tender_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          equipo_minimo?: string | null
          experiencia_minima?: string | null
          id?: string
          medios_minimos?: string | null
          tender_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          equipo_minimo?: string | null
          experiencia_minima?: string | null
          id?: string
          medios_minimos?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_requirements_tech_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_risks: {
        Row: {
          created_at: string
          descripcion: string
          id: string
          mitigacion: string | null
          nivel: string
          tender_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          id?: string
          mitigacion?: string | null
          nivel?: string
          tender_id: string
          tipo?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          id?: string
          mitigacion?: string | null
          nivel?: string
          tender_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_risks_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_strategy: {
        Row: {
          created_at: string
          estrategia_economica: string | null
          estrategia_tecnica: string | null
          id: string
          mejoras_propuestas: string | null
          narrativa_recomendada: string | null
          tender_id: string
        }
        Insert: {
          created_at?: string
          estrategia_economica?: string | null
          estrategia_tecnica?: string | null
          id?: string
          mejoras_propuestas?: string | null
          narrativa_recomendada?: string | null
          tender_id: string
        }
        Update: {
          created_at?: string
          estrategia_economica?: string | null
          estrategia_tecnica?: string | null
          id?: string
          mejoras_propuestas?: string | null
          narrativa_recomendada?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_strategy_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          clasificacion_requerida: string | null
          company_id: string
          contract_amount: number | null
          contracting_entity: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration: string | null
          garantia_definitiva: number | null
          garantia_provisional: number | null
          id: string
          project_id: string
          sector: string | null
          status: string
          submission_deadline: string | null
          title: string
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          clasificacion_requerida?: string | null
          company_id: string
          contract_amount?: number | null
          contracting_entity?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration?: string | null
          garantia_definitiva?: number | null
          garantia_provisional?: number | null
          id?: string
          project_id: string
          sector?: string | null
          status?: string
          submission_deadline?: string | null
          title: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          clasificacion_requerida?: string | null
          company_id?: string
          contract_amount?: number | null
          contracting_entity?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration?: string | null
          garantia_definitiva?: number | null
          garantia_provisional?: number | null
          id?: string
          project_id?: string
          sector?: string | null
          status?: string
          submission_deadline?: string | null
          title?: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      plan_tier: "starter" | "professional" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      plan_tier: ["starter", "professional", "enterprise"],
    },
  },
} as const

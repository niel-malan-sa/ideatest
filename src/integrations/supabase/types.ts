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
      analyses: {
        Row: {
          action_items: Json | null
          created_at: string
          go_no_go: string | null
          id: string
          idea_id: string
          market_potential: string | null
          recommendations: Json | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          go_no_go?: string | null
          id?: string
          idea_id: string
          market_potential?: string | null
          recommendations?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          go_no_go?: string | null
          id?: string
          idea_id?: string
          market_potential?: string | null
          recommendations?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          budget: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          language: string
          name: string
          status: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          language?: string
          name: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          language?: string
          name?: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          idea_id: string
          respondent: string
          source_file: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          idea_id: string
          respondent?: string
          source_file?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          respondent?: string
          source_file?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_notes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      job_frameworks: {
        Row: {
          alternative_roles: Json | null
          created_at: string
          id: string
          idea_id: string
          interview_questions: Json | null
          job_executor: string | null
          job_map_steps: Json | null
          survey_template: Json | null
          updated_at: string
        }
        Insert: {
          alternative_roles?: Json | null
          created_at?: string
          id?: string
          idea_id: string
          interview_questions?: Json | null
          job_executor?: string | null
          job_map_steps?: Json | null
          survey_template?: Json | null
          updated_at?: string
        }
        Update: {
          alternative_roles?: Json | null
          created_at?: string
          id?: string
          idea_id?: string
          interview_questions?: Json | null
          job_executor?: string | null
          job_map_steps?: Json | null
          survey_template?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_frameworks_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_scores: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          importance: number
          outcome_id: string
          respondent: string
          satisfaction: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          importance: number
          outcome_id: string
          respondent?: string
          satisfaction: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          importance?: number
          outcome_id?: string
          respondent?: string
          satisfaction?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcome_scores_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_scores_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          importance: number | null
          satisfaction: number | null
          statement: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          importance?: number | null
          satisfaction?: number | null
          statement: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          importance?: number | null
          satisfaction?: number | null
          statement?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      positioning_strategies: {
        Row: {
          alternative_angles: Json
          competitive_positioning: Json
          created_at: string
          id: string
          idea_id: string
          positioning_statement: Json
          updated_at: string
          value_hierarchy: Json
        }
        Insert: {
          alternative_angles?: Json
          competitive_positioning?: Json
          created_at?: string
          id?: string
          idea_id: string
          positioning_statement?: Json
          updated_at?: string
          value_hierarchy?: Json
        }
        Update: {
          alternative_angles?: Json
          competitive_positioning?: Json
          created_at?: string
          id?: string
          idea_id?: string
          positioning_statement?: Json
          updated_at?: string
          value_hierarchy?: Json
        }
        Relationships: [
          {
            foreignKeyName: "positioning_strategies_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          id: string
          industry: string | null
          name: string | null
          role: string | null
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string | null
          role?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string | null
          role?: string | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_data: {
        Row: {
          competitors: Json | null
          created_at: string
          id: string
          idea_id: string
          market_size: string | null
          updated_at: string
        }
        Insert: {
          competitors?: Json | null
          created_at?: string
          id?: string
          idea_id: string
          market_size?: string | null
          updated_at?: string
        }
        Update: {
          competitors?: Json | null
          created_at?: string
          id?: string
          idea_id?: string
          market_size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_data_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_messages: {
        Row: {
          cold_email: Json
          created_at: string
          elevator_pitch: Json
          id: string
          idea_id: string
          updated_at: string
        }
        Insert: {
          cold_email?: Json
          created_at?: string
          elevator_pitch?: Json
          id?: string
          idea_id: string
          updated_at?: string
        }
        Update: {
          cold_email?: Json
          created_at?: string
          elevator_pitch?: Json
          id?: string
          idea_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_messages_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_idea_owner: { Args: { p_idea_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

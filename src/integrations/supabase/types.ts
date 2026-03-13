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
      body_map_entries: {
        Row: {
          body_part: string
          created_at: string | null
          id: string
          intensity: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          body_part: string
          created_at?: string | null
          id?: string
          intensity?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          body_part?: string
          created_at?: string | null
          id?: string
          intensity?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_favorites: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "psychoeducation_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          completed: boolean | null
          content_id: string
          id: string
          last_accessed: string | null
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          content_id: string
          id?: string
          last_accessed?: string | null
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          content_id?: string
          id?: string
          last_accessed?: string | null
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "psychoeducation_content"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          id: string
          mood_score: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      day_timeline_entries: {
        Row: {
          created_at: string | null
          entry_date: string | null
          id: string
          mood_score: number | null
          note: string | null
          period: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_date?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          period: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_date?: string | null
          id?: string
          mood_score?: number | null
          note?: string | null
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_log: {
        Row: {
          created_at: string | null
          description: string
          dream_date: string | null
          emotions: string[] | null
          id: string
          lucid: boolean | null
          sleep_quality: number | null
          themes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          dream_date?: string | null
          emotions?: string[] | null
          id?: string
          lucid?: boolean | null
          sleep_quality?: number | null
          themes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          dream_date?: string | null
          emotions?: string[] | null
          id?: string
          lucid?: boolean | null
          sleep_quality?: number | null
          themes?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_seconds: number | null
          exercise_name: string | null
          exercise_type: string
          id: string
          mood_after: number | null
          mood_before: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          exercise_name?: string | null
          exercise_type: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          exercise_name?: string | null
          exercise_type?: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          user_id?: string
        }
        Relationships: []
      }
      internal_dialogues: {
        Row: {
          compassionate_voice: string
          created_at: string | null
          critical_voice: string
          id: string
          situation: string | null
          user_id: string
        }
        Insert: {
          compassionate_voice: string
          created_at?: string | null
          critical_voice: string
          id?: string
          situation?: string | null
          user_id: string
        }
        Update: {
          compassionate_voice?: string
          created_at?: string | null
          critical_voice?: string
          id?: string
          situation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          emotion_tags: string[] | null
          entry_date: string | null
          id: string
          prompt: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          emotion_tags?: string[] | null
          entry_date?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          emotion_tags?: string[] | null
          entry_date?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      micro_achievements: {
        Row: {
          achievement_date: string | null
          achievement_text: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_date?: string | null
          achievement_text: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_date?: string | null
          achievement_text?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_app_profiles: {
        Row: {
          areas_of_interest: string[] | null
          created_at: string | null
          display_name: string | null
          id: string
          life_stage: string | null
          linked_professional_code: string | null
          onboarding_completed: boolean | null
          recent_feelings: string[] | null
          treatment_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          areas_of_interest?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          life_stage?: string | null
          linked_professional_code?: string | null
          onboarding_completed?: boolean | null
          recent_feelings?: string[] | null
          treatment_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          areas_of_interest?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          life_stage?: string | null
          linked_professional_code?: string | null
          onboarding_completed?: boolean | null
          recent_feelings?: string[] | null
          treatment_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patients_intake: {
        Row: {
          age: number | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          insurance: string | null
          last_name: string
          modality: string | null
          phone: string | null
          reason: string | null
          status: string | null
          user_id: string | null
          zone: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          insurance?: string | null
          last_name: string
          modality?: string | null
          phone?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string | null
          zone?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          insurance?: string | null
          last_name?: string
          modality?: string | null
          phone?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      psychoeducation_content: {
        Row: {
          category: string
          content_type: string
          content_url: string
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          category: string
          content_type: string
          content_url: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          category?: string
          content_type?: string
          content_url?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      relationship_logs: {
        Row: {
          created_at: string | null
          emotion: string | null
          id: string
          person: string
          user_id: string
          what_happened: string | null
          what_i_wished: string | null
        }
        Insert: {
          created_at?: string | null
          emotion?: string | null
          id?: string
          person: string
          user_id: string
          what_happened?: string | null
          what_i_wished?: string | null
        }
        Update: {
          created_at?: string | null
          emotion?: string | null
          id?: string
          person?: string
          user_id?: string
          what_happened?: string | null
          what_i_wished?: string | null
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          created_at: string | null
          id: string
          mood_after: number | null
          note: string
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mood_after?: number | null
          note: string
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mood_after?: number | null
          note?: string
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string
          score: number
          severity: string | null
          test_type: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          score: number
          severity?: string | null
          test_type: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          score?: number
          severity?: string | null
          test_type?: string
          user_id?: string
        }
        Relationships: []
      }
      therapy_prep_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          resolved: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          resolved?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          resolved?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      thought_records: {
        Row: {
          alternative_thought: string | null
          automatic_thought: string | null
          created_at: string | null
          emotion: string | null
          emotion_intensity: number | null
          evidence_against: string | null
          evidence_for: string | null
          id: string
          new_emotion: string | null
          new_emotion_intensity: number | null
          situation: string
          user_id: string
        }
        Insert: {
          alternative_thought?: string | null
          automatic_thought?: string | null
          created_at?: string | null
          emotion?: string | null
          emotion_intensity?: number | null
          evidence_against?: string | null
          evidence_for?: string | null
          id?: string
          new_emotion?: string | null
          new_emotion_intensity?: number | null
          situation: string
          user_id: string
        }
        Update: {
          alternative_thought?: string | null
          automatic_thought?: string | null
          created_at?: string | null
          emotion?: string | null
          emotion_intensity?: number | null
          evidence_against?: string | null
          evidence_for?: string | null
          id?: string
          new_emotion?: string | null
          new_emotion_intensity?: number | null
          situation?: string
          user_id?: string
        }
        Relationships: []
      }
      unsent_letters: {
        Row: {
          action: string | null
          content: string
          created_at: string | null
          id: string
          recipient: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          content: string
          created_at?: string | null
          id?: string
          recipient?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          content?: string
          created_at?: string | null
          id?: string
          recipient?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          goal_text: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          goal_text: string
          id?: string
          user_id: string
          week_start?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          goal_text?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    },
  },
} as const

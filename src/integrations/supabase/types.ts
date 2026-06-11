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
      algo_option_links: {
        Row: {
          created_at: string
          id: string
          option_id: string
          sub_resource_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          sub_resource_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          sub_resource_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "algo_option_links_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "algo_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algo_option_links_sub_resource_id_fkey"
            columns: ["sub_resource_id"]
            isOneToOne: false
            referencedRelation: "algo_sub_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      algo_options: {
        Row: {
          created_at: string
          id: string
          label: string
          question_id: string
          score: number
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          question_id: string
          score?: number
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          question_id?: string
          score?: number
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "algo_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "algo_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      algo_psycho_links: {
        Row: {
          created_at: string
          id: string
          psycho_id: string
          sub_resource_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          psycho_id: string
          sub_resource_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          psycho_id?: string
          sub_resource_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "algo_psycho_links_psycho_id_fkey"
            columns: ["psycho_id"]
            isOneToOne: false
            referencedRelation: "psychoeducation_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algo_psycho_links_sub_resource_id_fkey"
            columns: ["sub_resource_id"]
            isOneToOne: false
            referencedRelation: "algo_sub_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      algo_questions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          kind: string
          prompt: string
          sort: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          kind?: string
          prompt: string
          sort?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          kind?: string
          prompt?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      algo_sub_resources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_id: string | null
          resource_category_id: string | null
          route: string | null
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          resource_category_id?: string | null
          route?: string | null
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          resource_category_id?: string | null
          route?: string | null
          slug?: string
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "algo_sub_resources_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "algo_sub_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algo_sub_resources_resource_category_id_fkey"
            columns: ["resource_category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      algo_user_answers: {
        Row: {
          answered_at: string
          answered_week: string
          id: string
          option_id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          answered_week?: string
          id?: string
          option_id: string
          question_id: string
          user_id: string
        }
        Update: {
          answered_at?: string
          answered_week?: string
          id?: string
          option_id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "algo_user_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "algo_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algo_user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "algo_questions"
            referencedColumns: ["id"]
          },
        ]
      }
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
          balance_highlight: string | null
          balance_improve: string | null
          checkin_date: string
          created_at: string | null
          dawn_score: string | null
          day_goal: string | null
          dream_note: string | null
          emotions: string[] | null
          goal_completed: string | null
          id: string
          mode: string | null
          mood_score: number | null
          note: string | null
          sleep_score: number | null
          thought_note: string | null
          user_id: string
        }
        Insert: {
          balance_highlight?: string | null
          balance_improve?: string | null
          checkin_date?: string
          created_at?: string | null
          dawn_score?: string | null
          day_goal?: string | null
          dream_note?: string | null
          emotions?: string[] | null
          goal_completed?: string | null
          id?: string
          mode?: string | null
          mood_score?: number | null
          note?: string | null
          sleep_score?: number | null
          thought_note?: string | null
          user_id: string
        }
        Update: {
          balance_highlight?: string | null
          balance_improve?: string | null
          checkin_date?: string
          created_at?: string | null
          dawn_score?: string | null
          day_goal?: string | null
          dream_note?: string | null
          emotions?: string[] | null
          goal_completed?: string | null
          id?: string
          mode?: string | null
          mood_score?: number | null
          note?: string | null
          sleep_score?: number | null
          thought_note?: string | null
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
          music_track: string | null
          pattern: string | null
          sub_mode: string | null
          user_id: string
          voice_enabled: boolean | null
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
          music_track?: string | null
          pattern?: string | null
          sub_mode?: string | null
          user_id: string
          voice_enabled?: boolean | null
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
          music_track?: string | null
          pattern?: string | null
          sub_mode?: string | null
          user_id?: string
          voice_enabled?: boolean | null
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
          highlighted: boolean | null
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
          highlighted?: boolean | null
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
          highlighted?: boolean | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          id: string
          log_date: string | null
          medication_id: string
          note: string | null
          side_effects: string[] | null
          taken: boolean | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          log_date?: string | null
          medication_id: string
          note?: string | null
          side_effects?: string[] | null
          taken?: boolean | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          log_date?: string | null
          medication_id?: string
          note?: string | null
          side_effects?: string[] | null
          taken?: boolean | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          dosage: string | null
          frequency: string | null
          id: string
          name: string
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          name: string
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          name?: string
          reminder_time?: string | null
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
      mindful_eating_entries: {
        Row: {
          created_at: string
          emotions: string[]
          entry_date: string
          entry_time: string
          hunger_level: number
          id: string
          meal_moment: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotions?: string[]
          entry_date?: string
          entry_time?: string
          hunger_level?: number
          id?: string
          meal_moment: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotions?: string[]
          entry_date?: string
          entry_time?: string
          hunger_level?: number
          id?: string
          meal_moment?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_app_profiles: {
        Row: {
          areas_of_interest: string[] | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          in_therapy: boolean | null
          life_stage: string | null
          linked_professional_code: string | null
          notifications_on: boolean | null
          onboarding_completed: boolean | null
          prefers_dark: boolean | null
          recent_feelings: string[] | null
          treatment_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          areas_of_interest?: string[] | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          in_therapy?: boolean | null
          life_stage?: string | null
          linked_professional_code?: string | null
          notifications_on?: boolean | null
          onboarding_completed?: boolean | null
          prefers_dark?: boolean | null
          recent_feelings?: string[] | null
          treatment_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          areas_of_interest?: string[] | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          in_therapy?: boolean | null
          life_stage?: string | null
          linked_professional_code?: string | null
          notifications_on?: boolean | null
          onboarding_completed?: boolean | null
          prefers_dark?: boolean | null
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
      psychoeducation_categories: {
        Row: {
          accent_color: string | null
          content_type: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      psychoeducation_content: {
        Row: {
          body_html: string | null
          category: string
          category_id: string | null
          content_type: string
          content_url: string
          created_at: string | null
          description: string | null
          duration: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean
          is_premium: boolean | null
          is_published: boolean | null
          media_url: string | null
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          body_html?: string | null
          category: string
          category_id?: string | null
          content_type: string
          content_url: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean
          is_premium?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          body_html?: string | null
          category?: string
          category_id?: string | null
          content_type?: string
          content_url?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean
          is_premium?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychoeducation_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "psychoeducation_categories"
            referencedColumns: ["id"]
          },
        ]
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
      resource_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      resource_tools: {
        Row: {
          category_id: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          tool_type: Database["public"]["Enums"]["tool_type"]
          updated_at: string
        }
        Insert: {
          category_id: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          tool_type?: Database["public"]["Enums"]["tool_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tool_type?: Database["public"]["Enums"]["tool_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      selfcare_tasks: {
        Row: {
          completed: boolean | null
          completed_date: string | null
          created_at: string | null
          id: string
          is_suggested: boolean | null
          task_text: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          is_suggested?: boolean | null
          task_text: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          is_suggested?: boolean | null
          task_text?: string
          user_id?: string
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
      sleep_log: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string | null
          quality: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          quality: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          quality?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_definitions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          instructions: string | null
          kind: string
          name: string
          scale_labels: Json | null
          scale_max: number
          scale_min: number
          sort: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          instructions?: string | null
          kind: string
          name: string
          scale_labels?: Json | null
          scale_max?: number
          scale_min?: number
          sort?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          instructions?: string | null
          kind?: string
          name?: string
          scale_labels?: Json | null
          scale_max?: number
          scale_min?: number
          sort?: number
        }
        Relationships: []
      }
      test_items: {
        Row: {
          created_at: string
          id: string
          options: Json | null
          prompt: string
          reverse: boolean
          sort: number
          subscale: string | null
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json | null
          prompt: string
          reverse?: boolean
          sort: number
          subscale?: string | null
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json | null
          prompt?: string
          reverse?: boolean
          sort?: number
          subscale?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "test_definitions"
            referencedColumns: ["id"]
          },
        ]
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
      values_reflections: {
        Row: {
          coherence_score: number
          created_at: string
          entry_date: string
          id: string
          life_area: string
          person_intention: string | null
          updated_at: string
          user_id: string
          weekly_action: string | null
        }
        Insert: {
          coherence_score?: number
          created_at?: string
          entry_date?: string
          id?: string
          life_area: string
          person_intention?: string | null
          updated_at?: string
          user_id: string
          weekly_action?: string | null
        }
        Update: {
          coherence_score?: number
          created_at?: string
          entry_date?: string
          id?: string
          life_area?: string
          person_intention?: string | null
          updated_at?: string
          user_id?: string
          weekly_action?: string | null
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
      weekly_reflections: {
        Row: {
          created_at: string | null
          id: string
          reflection_text: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reflection_text: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reflection_text?: string
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
      get_daily_recommendations: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          resource_category_id: string
          sub_resource_id: string
          sub_resource_name: string
          sub_resource_route: string
          sub_resource_slug: string
          total_score: number
        }[]
      }
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
      tool_type:
        | "breathing"
        | "grounding"
        | "mindfulness_timer"
        | "selfcare_list"
        | "content_link"
        | "custom"
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
      tool_type: [
        "breathing",
        "grounding",
        "mindfulness_timer",
        "selfcare_list",
        "content_link",
        "custom",
      ],
    },
  },
} as const

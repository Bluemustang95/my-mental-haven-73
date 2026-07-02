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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          payload: Json | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
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
      ba_baseline_entries: {
        Row: {
          activity: string
          agrado: number | null
          created_at: string
          day_of_week: number
          dominio: number | null
          emotion: string | null
          hour: number
          id: string
          intensity: number | null
          program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: string
          agrado?: number | null
          created_at?: string
          day_of_week: number
          dominio?: number | null
          emotion?: string | null
          hour: number
          id?: string
          intensity?: number | null
          program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: string
          agrado?: number | null
          created_at?: string
          day_of_week?: number
          dominio?: number | null
          emotion?: string | null
          hour?: number
          id?: string
          intensity?: number | null
          program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ba_baseline_entries_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ba_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      ba_content: {
        Row: {
          active: boolean
          barriers_catalog: Json
          clinical_plan: Json
          created_at: string
          cycle_text: Json
          daily_messages: Json
          default_ladder: Json
          id: string
          intro_slides: Json
          program_meta: Json
          singleton: boolean
          updated_at: string
          values_catalog: Json
          vlq_domains: Json
        }
        Insert: {
          active?: boolean
          barriers_catalog?: Json
          clinical_plan?: Json
          created_at?: string
          cycle_text?: Json
          daily_messages?: Json
          default_ladder?: Json
          id?: string
          intro_slides?: Json
          program_meta?: Json
          singleton?: boolean
          updated_at?: string
          values_catalog?: Json
          vlq_domains?: Json
        }
        Update: {
          active?: boolean
          barriers_catalog?: Json
          clinical_plan?: Json
          created_at?: string
          cycle_text?: Json
          daily_messages?: Json
          default_ladder?: Json
          id?: string
          intro_slides?: Json
          program_meta?: Json
          singleton?: boolean
          updated_at?: string
          values_catalog?: Json
          vlq_domains?: Json
        }
        Relationships: []
      }
      ba_day_logs: {
        Row: {
          actual_difficulty: number | null
          agrado: number | null
          anticipated_difficulty: number | null
          barrier_chosen: string | null
          completed_at: string | null
          created_at: string
          day: number
          dominio: number | null
          id: string
          phase: string
          program_id: string
          scheduled_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_difficulty?: number | null
          agrado?: number | null
          anticipated_difficulty?: number | null
          barrier_chosen?: string | null
          completed_at?: string | null
          created_at?: string
          day: number
          dominio?: number | null
          id?: string
          phase?: string
          program_id: string
          scheduled_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_difficulty?: number | null
          agrado?: number | null
          anticipated_difficulty?: number | null
          barrier_chosen?: string | null
          completed_at?: string | null
          created_at?: string
          day?: number
          dominio?: number | null
          id?: string
          phase?: string
          program_id?: string
          scheduled_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ba_day_logs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ba_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      ba_programs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_day: number
          day_one_step: number
          goals: Json
          id: string
          ladder: Json
          last_completed_date: string | null
          motivation: string | null
          selected_goal_idx: number | null
          selected_values: Json
          started_at: string
          state: string
          updated_at: string
          user_id: string
          vlq_completed_at: string | null
          vlq_consistency: Json
          vlq_importance: Json
          vlq_top_domains: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          day_one_step?: number
          goals?: Json
          id?: string
          ladder?: Json
          last_completed_date?: string | null
          motivation?: string | null
          selected_goal_idx?: number | null
          selected_values?: Json
          started_at?: string
          state?: string
          updated_at?: string
          user_id: string
          vlq_completed_at?: string | null
          vlq_consistency?: Json
          vlq_importance?: Json
          vlq_top_domains?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          day_one_step?: number
          goals?: Json
          id?: string
          ladder?: Json
          last_completed_date?: string | null
          motivation?: string | null
          selected_goal_idx?: number | null
          selected_values?: Json
          started_at?: string
          state?: string
          updated_at?: string
          user_id?: string
          vlq_completed_at?: string | null
          vlq_consistency?: Json
          vlq_importance?: Json
          vlq_top_domains?: Json
        }
        Relationships: []
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
      crisis_hotlines: {
        Row: {
          active: boolean
          country: string
          created_at: string
          id: string
          label: string
          phone: string
          priority: number
        }
        Insert: {
          active?: boolean
          country: string
          created_at?: string
          id?: string
          label: string
          phone: string
          priority?: number
        }
        Update: {
          active?: boolean
          country?: string
          created_at?: string
          id?: string
          label?: string
          phone?: string
          priority?: number
        }
        Relationships: []
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
      daily_quotes: {
        Row: {
          active: boolean
          author: string | null
          created_at: string
          id: string
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          text?: string
          updated_at?: string
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
      dbt_emotion_sessions: {
        Row: {
          catastrophe_coping: string | null
          completed_at: string | null
          created_at: string
          emotion: string
          event_description: string | null
          fits_facts: boolean | null
          id: string
          interpretations: string | null
          is_effective: boolean | null
          opposite_payload: Json | null
          path: string | null
          problem_payload: Json | null
          threat: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          catastrophe_coping?: string | null
          completed_at?: string | null
          created_at?: string
          emotion: string
          event_description?: string | null
          fits_facts?: boolean | null
          id?: string
          interpretations?: string | null
          is_effective?: boolean | null
          opposite_payload?: Json | null
          path?: string | null
          problem_payload?: Json | null
          threat?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          catastrophe_coping?: string | null
          completed_at?: string | null
          created_at?: string
          emotion?: string
          event_description?: string | null
          fits_facts?: boolean | null
          id?: string
          interpretations?: string | null
          is_effective?: boolean | null
          opposite_payload?: Json | null
          path?: string | null
          problem_payload?: Json | null
          threat?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string | null
          token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string | null
          token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string | null
          token?: string
          user_agent?: string | null
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
          takeaway: string | null
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
          takeaway?: string | null
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
          takeaway?: string | null
          user_id?: string
          voice_enabled?: boolean | null
        }
        Relationships: []
      }
      habit_categories: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          best_streak: number
          cadence: string
          category_key: string
          color: string
          created_at: string
          description: string | null
          frequency: string
          frequency_count: number
          icon: string
          icon_type: string
          id: string
          name: string
          reminders_enabled: boolean
          stack_after_habit_id: string | null
          text_color: string
          time_slot: string
          updated_at: string
          user_id: string
          value_key: string
        }
        Insert: {
          archived_at?: string | null
          best_streak?: number
          cadence?: string
          category_key?: string
          color?: string
          created_at?: string
          description?: string | null
          frequency?: string
          frequency_count?: number
          icon?: string
          icon_type?: string
          id?: string
          name: string
          reminders_enabled?: boolean
          stack_after_habit_id?: string | null
          text_color?: string
          time_slot?: string
          updated_at?: string
          user_id: string
          value_key?: string
        }
        Update: {
          archived_at?: string | null
          best_streak?: number
          cadence?: string
          category_key?: string
          color?: string
          created_at?: string
          description?: string | null
          frequency?: string
          frequency_count?: number
          icon?: string
          icon_type?: string
          id?: string
          name?: string
          reminders_enabled?: boolean
          stack_after_habit_id?: string | null
          text_color?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
          value_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_stack_after_habit_id_fkey"
            columns: ["stack_after_habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      home_layouts: {
        Row: {
          created_at: string
          groups_order: Json
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          groups_order?: Json
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          groups_order?: Json
          updated_at?: string
          user_id?: string
          widgets?: Json
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
          attachments: Json | null
          content: string
          created_at: string | null
          emotion_tags: string[] | null
          entry_date: string | null
          highlighted: boolean | null
          id: string
          is_encrypted: boolean
          prompt: string | null
          updated_at: string | null
          user_id: string
          voice_note_path: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          emotion_tags?: string[] | null
          entry_date?: string | null
          highlighted?: boolean | null
          id?: string
          is_encrypted?: boolean
          prompt?: string | null
          updated_at?: string | null
          user_id: string
          voice_note_path?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          emotion_tags?: string[] | null
          entry_date?: string | null
          highlighted?: boolean | null
          id?: string
          is_encrypted?: boolean
          prompt?: string | null
          updated_at?: string | null
          user_id?: string
          voice_note_path?: string | null
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
      mindfulness_scripts: {
        Row: {
          category: string
          created_at: string
          duration_min: number | null
          id: string
          markers: Json
          script: string
          sub_key: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          duration_min?: number | null
          id?: string
          markers?: Json
          script?: string
          sub_key?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_min?: number | null
          id?: string
          markers?: Json
          script?: string
          sub_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mindfulness_sound_settings: {
        Row: {
          defaults: Json
          enabled_ids: Json
          id: number
          updated_at: string
        }
        Insert: {
          defaults?: Json
          enabled_ids?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          defaults?: Json
          enabled_ids?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          data: Json | null
          error: string | null
          id: string
          kind: string
          sent_at: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          data?: Json | null
          error?: string | null
          id?: string
          kind: string
          sent_at?: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          data?: Json | null
          error?: string | null
          id?: string
          kind?: string
          sent_at?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          admin_enabled: boolean
          checkin_enabled: boolean
          checkin_time: string
          habits_enabled: boolean
          medication_enabled: boolean
          push_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_enabled?: boolean
          checkin_enabled?: boolean
          checkin_time?: string
          habits_enabled?: boolean
          medication_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_enabled?: boolean
          checkin_enabled?: boolean
          checkin_time?: string
          habits_enabled?: boolean
          medication_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          category: string
          condition_text: string | null
          copy_text: string
          enabled: boolean
          id: string
          sort_order: number
          trigger_key: string
          updated_at: string
        }
        Insert: {
          category: string
          condition_text?: string | null
          copy_text: string
          enabled?: boolean
          id?: string
          sort_order?: number
          trigger_key: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition_text?: string | null
          copy_text?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          trigger_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_app_profiles: {
        Row: {
          areas_of_interest: string[] | null
          bridge_assigned_at: string | null
          bridge_last_state: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          in_therapy: boolean | null
          learning_format: string | null
          life_stage: string | null
          linked_last_name: string | null
          linked_phone: string | null
          linked_professional_code: string | null
          module_scores: Json | null
          next_session_at: string | null
          notifications_on: boolean | null
          onboarding_completed: boolean | null
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          prefers_dark: boolean | null
          priority_module: string | null
          recent_feelings: string[] | null
          satisfaction_survey_completed_at: string | null
          satisfaction_survey_dismissed_at: string | null
          session_reminder_dismissed_at: string | null
          sleep_quality: string | null
          therapist_email: string | null
          therapist_license: string | null
          therapist_name: string | null
          therapist_phone: string | null
          treatment_status: string | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
        }
        Insert: {
          areas_of_interest?: string[] | null
          bridge_assigned_at?: string | null
          bridge_last_state?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          in_therapy?: boolean | null
          learning_format?: string | null
          life_stage?: string | null
          linked_last_name?: string | null
          linked_phone?: string | null
          linked_professional_code?: string | null
          module_scores?: Json | null
          next_session_at?: string | null
          notifications_on?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          prefers_dark?: boolean | null
          priority_module?: string | null
          recent_feelings?: string[] | null
          satisfaction_survey_completed_at?: string | null
          satisfaction_survey_dismissed_at?: string | null
          session_reminder_dismissed_at?: string | null
          sleep_quality?: string | null
          therapist_email?: string | null
          therapist_license?: string | null
          therapist_name?: string | null
          therapist_phone?: string | null
          treatment_status?: string | null
          updated_at?: string | null
          user_id: string
          voice_id?: string | null
        }
        Update: {
          areas_of_interest?: string[] | null
          bridge_assigned_at?: string | null
          bridge_last_state?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          in_therapy?: boolean | null
          learning_format?: string | null
          life_stage?: string | null
          linked_last_name?: string | null
          linked_phone?: string | null
          linked_professional_code?: string | null
          module_scores?: Json | null
          next_session_at?: string | null
          notifications_on?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          prefers_dark?: boolean | null
          priority_module?: string | null
          recent_feelings?: string[] | null
          satisfaction_survey_completed_at?: string | null
          satisfaction_survey_dismissed_at?: string | null
          session_reminder_dismissed_at?: string | null
          sleep_quality?: string | null
          therapist_email?: string | null
          therapist_license?: string | null
          therapist_name?: string | null
          therapist_phone?: string | null
          treatment_status?: string | null
          updated_at?: string | null
          user_id?: string
          voice_id?: string | null
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
      practice_responses: {
        Row: {
          completed: boolean
          content_id: string
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content_id: string
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content_id?: string
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_responses_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "psychoeducation_content"
            referencedColumns: ["id"]
          },
        ]
      }
      psychoeducation_categories: {
        Row: {
          accent_color: string | null
          content_type: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_premium: boolean
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
          is_premium?: boolean
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
          is_premium?: boolean
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
          practice_blocks: Json | null
          practice_intro: string | null
          sort_order: number | null
          tags: string[] | null
          text_kind: string
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
          practice_blocks?: Json | null
          practice_intro?: string | null
          sort_order?: number | null
          tags?: string[] | null
          text_kind?: string
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
          practice_blocks?: Json | null
          practice_intro?: string | null
          sort_order?: number | null
          tags?: string[] | null
          text_kind?: string
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
      psychology_news: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          summary: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          summary?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string | null
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
      resmita_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
      safety_plans: {
        Row: {
          contacts: Json
          coping_strategies: Json
          created_at: string
          environment_notes: string | null
          reasons_for_living: string | null
          updated_at: string
          user_id: string
          warning_signs: Json
        }
        Insert: {
          contacts?: Json
          coping_strategies?: Json
          created_at?: string
          environment_notes?: string | null
          reasons_for_living?: string | null
          updated_at?: string
          user_id: string
          warning_signs?: Json
        }
        Update: {
          contacts?: Json
          coping_strategies?: Json
          created_at?: string
          environment_notes?: string | null
          reasons_for_living?: string | null
          updated_at?: string
          user_id?: string
          warning_signs?: Json
        }
        Relationships: []
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
      sleep_hygiene_audits: {
        Row: {
          audit_date: string
          created_at: string
          id: string
          items: Json
          score: number
          sos_mode: string | null
          user_id: string
        }
        Insert: {
          audit_date?: string
          created_at?: string
          id?: string
          items?: Json
          score?: number
          sos_mode?: string | null
          user_id: string
        }
        Update: {
          audit_date?: string
          created_at?: string
          id?: string
          items?: Json
          score?: number
          sos_mode?: string | null
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
          baremos: Json | null
          code: string
          created_at: string
          id: string
          instructions: string | null
          kind: string
          name: string
          result_message: string | null
          scale_labels: Json | null
          scale_max: number
          scale_min: number
          sort: number
          trait_descriptions: Json | null
        }
        Insert: {
          active?: boolean
          baremos?: Json | null
          code: string
          created_at?: string
          id?: string
          instructions?: string | null
          kind: string
          name: string
          result_message?: string | null
          scale_labels?: Json | null
          scale_max?: number
          scale_min?: number
          sort?: number
          trait_descriptions?: Json | null
        }
        Update: {
          active?: boolean
          baremos?: Json | null
          code?: string
          created_at?: string
          id?: string
          instructions?: string | null
          kind?: string
          name?: string
          result_message?: string | null
          scale_labels?: Json | null
          scale_max?: number
          scale_min?: number
          sort?: number
          trait_descriptions?: Json | null
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
          shared_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          resolved?: boolean | null
          shared_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          resolved?: boolean | null
          shared_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      therapy_satisfaction_surveys: {
        Row: {
          bond_rating: number | null
          comment: string | null
          completed_at: string | null
          contacted_in_24h: boolean | null
          created_at: string
          final_nps: number | null
          id: string
          modality_match: string | null
          not_started_reasons: string[] | null
          nps_score: number | null
          other_reason: string | null
          sessions_count: string | null
          started_treatment: boolean | null
          triggered_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bond_rating?: number | null
          comment?: string | null
          completed_at?: string | null
          contacted_in_24h?: boolean | null
          created_at?: string
          final_nps?: number | null
          id?: string
          modality_match?: string | null
          not_started_reasons?: string[] | null
          nps_score?: number | null
          other_reason?: string | null
          sessions_count?: string | null
          started_treatment?: boolean | null
          triggered_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bond_rating?: number | null
          comment?: string | null
          completed_at?: string | null
          contacted_in_24h?: boolean | null
          created_at?: string
          final_nps?: number | null
          id?: string
          modality_match?: string | null
          not_started_reasons?: string[] | null
          nps_score?: number | null
          other_reason?: string | null
          sessions_count?: string | null
          started_treatment?: boolean | null
          triggered_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      thought_records: {
        Row: {
          action_plan: Json | null
          alternative_thought: string | null
          automatic_thought: string | null
          behavior: string | null
          body_sensations: string[]
          brainstorm: string | null
          completed_at: string | null
          created_at: string | null
          distortion_key: string | null
          distortion_label: string | null
          distortions: Json
          emotion: string | null
          emotion_intensity: number | null
          emotion_other: string | null
          evidence_against: string | null
          evidence_against_json: Json | null
          evidence_for: string | null
          evidence_for_json: Json | null
          id: string
          is_real_problem: boolean | null
          new_emotion: string | null
          new_emotion_intensity: number | null
          resolution_mode: string | null
          resolution_plan: string | null
          situation: string
          sub_emotions: string[]
          trainer_score: number | null
          user_id: string
        }
        Insert: {
          action_plan?: Json | null
          alternative_thought?: string | null
          automatic_thought?: string | null
          behavior?: string | null
          body_sensations?: string[]
          brainstorm?: string | null
          completed_at?: string | null
          created_at?: string | null
          distortion_key?: string | null
          distortion_label?: string | null
          distortions?: Json
          emotion?: string | null
          emotion_intensity?: number | null
          emotion_other?: string | null
          evidence_against?: string | null
          evidence_against_json?: Json | null
          evidence_for?: string | null
          evidence_for_json?: Json | null
          id?: string
          is_real_problem?: boolean | null
          new_emotion?: string | null
          new_emotion_intensity?: number | null
          resolution_mode?: string | null
          resolution_plan?: string | null
          situation: string
          sub_emotions?: string[]
          trainer_score?: number | null
          user_id: string
        }
        Update: {
          action_plan?: Json | null
          alternative_thought?: string | null
          automatic_thought?: string | null
          behavior?: string | null
          body_sensations?: string[]
          brainstorm?: string | null
          completed_at?: string | null
          created_at?: string | null
          distortion_key?: string | null
          distortion_label?: string | null
          distortions?: Json
          emotion?: string | null
          emotion_intensity?: number | null
          emotion_other?: string | null
          evidence_against?: string | null
          evidence_against_json?: Json | null
          evidence_for?: string | null
          evidence_for_json?: Json | null
          id?: string
          is_real_problem?: boolean | null
          new_emotion?: string | null
          new_emotion_intensity?: number | null
          resolution_mode?: string | null
          resolution_plan?: string | null
          situation?: string
          sub_emotions?: string[]
          trainer_score?: number | null
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
      vlq_responses: {
        Row: {
          consistency: number
          created_at: string
          domain_key: string
          gap: number | null
          id: string
          importance: number
          program_id: string | null
          user_id: string
        }
        Insert: {
          consistency: number
          created_at?: string
          domain_key: string
          gap?: number | null
          id?: string
          importance: number
          program_id?: string | null
          user_id: string
        }
        Update: {
          consistency?: number
          created_at?: string
          domain_key?: string
          gap?: number | null
          id?: string
          importance?: number
          program_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vlq_responses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ba_programs"
            referencedColumns: ["id"]
          },
        ]
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
      admin_bulk_set_plan: {
        Args: {
          _expires_at: string
          _plan: string
          _reason?: string
          _user_ids: string[]
        }
        Returns: number
      }
      admin_get_patient: {
        Args: { _user_id: string }
        Returns: {
          areas_of_interest: string[] | null
          bridge_assigned_at: string | null
          bridge_last_state: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          in_therapy: boolean | null
          learning_format: string | null
          life_stage: string | null
          linked_last_name: string | null
          linked_phone: string | null
          linked_professional_code: string | null
          module_scores: Json | null
          next_session_at: string | null
          notifications_on: boolean | null
          onboarding_completed: boolean | null
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          prefers_dark: boolean | null
          priority_module: string | null
          recent_feelings: string[] | null
          satisfaction_survey_completed_at: string | null
          satisfaction_survey_dismissed_at: string | null
          session_reminder_dismissed_at: string | null
          sleep_quality: string | null
          therapist_email: string | null
          therapist_license: string | null
          therapist_name: string | null
          therapist_phone: string | null
          treatment_status: string | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "patient_app_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_patients: {
        Args: never
        Returns: {
          country: string
          created_at: string
          display_name: string
          email: string
          is_admin: boolean
          life_stage: string
          onboarding_completed: boolean
          plan: string
          plan_expires_at: string
          plan_started_at: string
          treatment_status: string
          user_id: string
        }[]
      }
      admin_set_admin_role: {
        Args: { _is_admin: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_plan:
        | {
            Args: { _expires_at: string; _plan: string; _user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              _expires_at: string
              _plan: string
              _reason?: string
              _user_id: string
            }
            Returns: undefined
          }
      admin_stats_overview: { Args: never; Returns: Json }
      get_daily_quote: {
        Args: never
        Returns: {
          author: string
          id: string
          text: string
        }[]
      }
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

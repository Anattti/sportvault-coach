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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      coach_clients: {
        Row: {
          accepted_at: string | null
          client_id: string
          coach_id: string
          id: string
          invited_at: string | null
          notes: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          coach_id: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          coach_id?: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      coach_exercise_notes: {
        Row: {
          coach_id: string
          content: string
          created_at: string | null
          id: string
          session_exercise_id: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          content: string
          created_at?: string | null
          id?: string
          session_exercise_id: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string | null
          id?: string
          session_exercise_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_exercise_notes_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_invitations: {
        Row: {
          client_email: string | null
          coach_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          invite_code: string
          used_at: string | null
        }
        Insert: {
          client_email?: string | null
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          used_at?: string | null
        }
        Update: {
          client_email?: string | null
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          used_at?: string | null
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string | null
          id: string
          max_clients: number | null
          stripe_customer_id: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          id: string
          max_clients?: number | null
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          id?: string
          max_clients?: number | null
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_program_assignments: {
        Row: {
          assigned_at: string | null
          client_id: string
          coach_id: string
          id: string
          notes: string | null
          workout_id: string
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          coach_id: string
          id?: string
          notes?: string | null
          workout_id: string
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          coach_id?: string
          id?: string
          notes?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_program_assignments_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_session_notes: {
        Row: {
          coach_id: string
          content: string
          created_at: string | null
          id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          content: string
          created_at?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          created_at: string
          cycle_week: number
          exercise_id: string
          id: string
          is_bodyweight: boolean | null
          reps: number
          rest_time: number
          rpe: number | null
          set_index: number | null
          sets: number
          target_type: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          cycle_week?: number
          exercise_id: string
          id?: string
          is_bodyweight?: boolean | null
          reps: number
          rest_time: number
          rpe?: number | null
          set_index?: number | null
          sets?: number
          target_type?: string | null
          weight: number
        }
        Update: {
          created_at?: string
          cycle_week?: number
          exercise_id?: string
          id?: string
          is_bodyweight?: boolean | null
          reps?: number
          rest_time?: number
          rpe?: number | null
          set_index?: number | null
          sets?: number
          target_type?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          order_index: number | null
          superset_group: number | null
          target_rpe: number | null
          workout_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          superset_group?: number | null
          target_rpe?: number | null
          workout_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          superset_group?: number | null
          target_rpe?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          deadline: string | null
          exercise_name: string | null
          id: string
          is_completed: boolean
          target_value: number
          title: string
          type: string
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          exercise_name?: string | null
          id?: string
          is_completed?: boolean
          target_value: number
          title: string
          type: string
          unit: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          exercise_name?: string | null
          id?: string
          is_completed?: boolean
          target_value?: number
          title?: string
          type?: string
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_workouts: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          reminder_minutes: number | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reminder_minutes?: number | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          reminder_minutes?: number | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          heart_rate_avg: number | null
          heart_rate_max: number | null
          heart_rate_samples: Json | null
          id: string
          is_ad_hoc: boolean | null
          is_swapped: boolean | null
          name: string
          notes: string | null
          order_index: number | null
          original_exercise_name: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          heart_rate_samples?: Json | null
          id?: string
          is_ad_hoc?: boolean | null
          is_swapped?: boolean | null
          name: string
          notes?: string | null
          order_index?: number | null
          original_exercise_name?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          heart_rate_samples?: Json | null
          id?: string
          is_ad_hoc?: boolean | null
          is_swapped?: boolean | null
          name?: string
          notes?: string | null
          order_index?: number | null
          original_exercise_name?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_sets: {
        Row: {
          _offline: boolean | null
          _pendingsync: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          reps_completed: number | null
          rest_time_taken: number | null
          rpe: number | null
          session_exercise_id: string | null
          set_index: number | null
          sets_completed: number | null
          weight_used: number | null
        }
        Insert: {
          _offline?: boolean | null
          _pendingsync?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rest_time_taken?: number | null
          rpe?: number | null
          session_exercise_id?: string | null
          set_index?: number | null
          sets_completed?: number | null
          weight_used?: number | null
        }
        Update: {
          _offline?: boolean | null
          _pendingsync?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rest_time_taken?: number | null
          rpe?: number | null
          session_exercise_id?: string | null
          set_index?: number | null
          sets_completed?: number | null
          weight_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workouts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          share_token: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          share_token: string
          workout_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          share_token?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          created_at: string | null
          experience_level: string | null
          fitness_goals: string | null
          height: number | null
          id: string
          nickname: string | null
          role: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          experience_level?: string | null
          fitness_goals?: string | null
          height?: number | null
          id: string
          nickname?: string | null
          role?: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          experience_level?: string | null
          fitness_goals?: string | null
          height?: number | null
          id?: string
          nickname?: string | null
          role?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      workout_results: {
        Row: {
          completed_at: string | null
          cooldown: Json | null
          created_at: string | null
          duration: number
          id: string
          notes: Json | null
          user_id: string
          warmup: Json | null
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cooldown?: Json | null
          created_at?: string | null
          duration: number
          id?: string
          notes?: Json | null
          user_id: string
          warmup?: Json | null
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cooldown?: Json | null
          created_at?: string | null
          duration?: number
          id?: string
          notes?: Json | null
          user_id?: string
          warmup?: Json | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_results_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          _offline: boolean | null
          _pendingsync: boolean | null
          cooldown: Json | null
          created_at: string | null
          cycle_week: number
          date: string | null
          duration: number | null
          feeling: number | null
          heart_rate_avg: number | null
          heart_rate_max: number | null
          heart_rate_samples: Json | null
          id: string
          is_deload: boolean | null
          notes: string | null
          rpe_average: number | null
          total_volume: number | null
          user_id: string | null
          warmup: Json | null
          workout_id: string | null
        }
        Insert: {
          _offline?: boolean | null
          _pendingsync?: boolean | null
          cooldown?: Json | null
          created_at?: string | null
          cycle_week?: number
          date?: string | null
          duration?: number | null
          feeling?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          heart_rate_samples?: Json | null
          id?: string
          is_deload?: boolean | null
          notes?: string | null
          rpe_average?: number | null
          total_volume?: number | null
          user_id?: string | null
          warmup?: Json | null
          workout_id?: string | null
        }
        Update: {
          _offline?: boolean | null
          _pendingsync?: boolean | null
          cooldown?: Json | null
          created_at?: string | null
          cycle_week?: number
          date?: string | null
          duration?: number | null
          feeling?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          heart_rate_samples?: Json | null
          id?: string
          is_deload?: boolean | null
          notes?: string | null
          rpe_average?: number | null
          total_volume?: number | null
          user_id?: string | null
          warmup?: Json | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_results: {
        Row: {
          created_at: string | null
          exercise_index: number
          exercise_name: string
          id: string
          notes: string | null
          reps: number
          rpe: number | null
          set_index: number
          sets: number
          superset_group: number | null
          weight: number
          workout_result_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_index: number
          exercise_name: string
          id?: string
          notes?: string | null
          reps: number
          rpe?: number | null
          set_index: number
          sets?: number
          superset_group?: number | null
          weight: number
          workout_result_id: string
        }
        Update: {
          created_at?: string | null
          exercise_index?: number
          exercise_name?: string
          id?: string
          notes?: string | null
          reps?: number
          rpe?: number | null
          set_index?: number
          sets?: number
          superset_group?: number | null
          weight?: number
          workout_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_results_workout_result_id_fkey"
            columns: ["workout_result_id"]
            isOneToOne: false
            referencedRelation: "workout_results"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          cycle_weeks: number
          date: string
          deload_cycle: number | null
          display_order: number | null
          duration: number
          feeling: number
          id: string
          managed_by_coach: boolean
          notes: string | null
          program: string
          programmed_deloads: number[] | null
          progression: string | null
          progression_percentage: string | null
          source_template_id: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string
          cycle_weeks?: number
          date: string
          deload_cycle?: number | null
          display_order?: number | null
          duration: number
          feeling: number
          id?: string
          notes?: string | null
          program: string
          programmed_deloads?: number[] | null
          progression?: string | null
          progression_percentage?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          created_at?: string
          cycle_weeks?: number
          date?: string
          deload_cycle?: number | null
          display_order?: number | null
          duration?: number
          feeling?: number
          id?: string
          notes?: string | null
          program?: string
          programmed_deloads?: number[] | null
          progression?: string | null
          progression_percentage?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_coach_profile: {
        Args: { p_business_name?: string | null }
        Returns: Json
      }
      accept_coach_invitation: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      get_coach_invitation_preview: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      delete_workout_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      get_shared_workout: { Args: { p_share_token: string }; Returns: Json }
      insert_workout_with_children:
        | {
            Args: {
              p_date: string
              p_duration: number
              p_exercises: Json
              p_feeling: number
              p_notes?: string
              p_program?: string
              p_progression?: string
              p_progression_percentage?: string
              p_user_id?: string
              p_workout_type?: string
            }
            Returns: {
              workout_created_at: string
              workout_id: string
            }[]
          }
        | {
            Args: {
              p_date: string
              p_deload_cycle?: number
              p_duration: number
              p_exercises: Json
              p_feeling: number
              p_notes: string
              p_program: string
              p_progression: string
              p_progression_percentage: string
              p_user_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_weeks?: number
              p_date: string
              p_deload_cycle?: number
              p_duration: number
              p_exercises: Json
              p_feeling: number
              p_notes: string
              p_program: string
              p_progression: string
              p_progression_percentage: string
              p_user_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_weeks?: number
              p_date: string
              p_deload_cycle?: number
              p_duration: number
              p_exercises: Json
              p_feeling: number
              p_notes: string
              p_program: string
              p_programmed_deloads?: number[]
              p_progression: string
              p_progression_percentage: string
              p_user_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_weeks?: number
              p_date: string
              p_deload_cycle?: number
              p_duration: number
              p_exercises: Json
              p_feeling: number
              p_managed_by_coach?: boolean
              p_notes: string
              p_program: string
              p_programmed_deloads?: number[]
              p_progression: string
              p_progression_percentage: string
              p_source_template_id?: string | null
              p_user_id: string
              p_workout_type: string
            }
            Returns: Json
          }
      save_full_workout_session: { Args: { payload: Json }; Returns: Json }
      update_template_from_session:
        | { Args: { p_session_id: string }; Returns: undefined }
        | {
            Args: { p_session_id: string; p_workout_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_week?: number
              p_session_id: string
              p_workout_id: string
            }
            Returns: Json
          }
      upsert_workout_details:
        | {
            Args: {
              p_exercises: Json
              p_notes: string
              p_program: string
              p_workout_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_deload_cycle?: number
              p_exercises: Json
              p_notes: string
              p_program: string
              p_workout_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_weeks?: number
              p_deload_cycle?: number
              p_exercises: Json
              p_notes: string
              p_program: string
              p_workout_id: string
              p_workout_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_weeks?: number
              p_deload_cycle?: number
              p_exercises: Json
              p_notes: string
              p_program: string
              p_programmed_deloads?: number[]
              p_workout_id: string
              p_workout_type: string
            }
            Returns: Json
          }
      upsert_workout_with_children: {
        Args: {
          p_date: string
          p_duration: number
          p_exercises: Json
          p_feeling: number
          p_notes?: string
          p_program: string
          p_progression?: string
          p_progression_percentage?: string
          p_user_id: string
          p_workout_id?: string
          p_workout_type: string
        }
        Returns: {
          workout_created_at: string
          workout_id: string
        }[]
      }
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

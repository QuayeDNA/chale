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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answers: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          expiry_state: Database["public"]["Enums"]["expiry_state"]
          id: string
          kind: Database["public"]["Enums"]["answer_kind"]
          prompt_id: string
          saved_at: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          expiry_state?: Database["public"]["Enums"]["expiry_state"]
          id?: string
          kind: Database["public"]["Enums"]["answer_kind"]
          prompt_id: string
          saved_at?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          expiry_state?: Database["public"]["Enums"]["expiry_state"]
          id?: string
          kind?: Database["public"]["Enums"]["answer_kind"]
          prompt_id?: string
          saved_at?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          longest_streak: number
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          status: Database["public"]["Enums"]["connection_status"]
          streak_count: number
          updated_at: string
          user_a_id: string
          user_b_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          longest_streak?: number
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          status?: Database["public"]["Enums"]["connection_status"]
          streak_count?: number
          updated_at?: string
          user_a_id: string
          user_b_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          longest_streak?: number
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          status?: Database["public"]["Enums"]["connection_status"]
          streak_count?: number
          updated_at?: string
          user_a_id?: string
          user_b_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          connection_id: string
          created_at: string
          date: string
          id: string
          question_id: string
          reveal_state: Database["public"]["Enums"]["reveal_state"]
        }
        Insert: {
          connection_id: string
          created_at?: string
          date: string
          id?: string
          question_id: string
          reveal_state?: Database["public"]["Enums"]["reveal_state"]
        }
        Update: {
          connection_id?: string
          created_at?: string
          date?: string
          id?: string
          question_id?: string
          reveal_state?: Database["public"]["Enums"]["reveal_state"]
        }
        Relationships: [
          {
            foreignKeyName: "prompts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_packs: {
        Row: {
          category: string | null
          created_at: string
          id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          title?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["question_kind"]
          pack_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["question_kind"]
          pack_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["question_kind"]
          pack_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "question_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          push_token: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          push_token?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          push_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      voice_listens: {
        Row: {
          answer_id: string
          listened_at: string
          listener_id: string
        }
        Insert: {
          answer_id: string
          listened_at?: string
          listener_id: string
        }
        Update: {
          answer_id?: string
          listened_at?: string
          listener_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_listens_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_listens_listener_id_fkey"
            columns: ["listener_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      connection_member_ids: {
        Args: { p_connection: string }
        Returns: string[]
      }
      create_connection: {
        Args: never
        Returns: {
          out_id: string
          out_invite_code: string
        }[]
      }
      get_or_create_today_prompt: {
        Args: { p_connection: string }
        Returns: {
          out_kind: Database["public"]["Enums"]["question_kind"]
          out_prompt: string
          out_question: string
          out_reveal_state: Database["public"]["Enums"]["reveal_state"]
          out_text: string
        }[]
      }
      join_connection: {
        Args: { p_code: string }
        Returns: {
          out_id: string
          out_status: Database["public"]["Enums"]["connection_status"]
        }[]
      }
      make_invite_code: { Args: never; Returns: string }
      record_listen: { Args: { p_answer: string }; Returns: undefined }
      save_own_clip: { Args: { p_answer: string }; Returns: undefined }
      submit_answer: {
        Args: {
          p_content: string
          p_kind: Database["public"]["Enums"]["answer_kind"]
          p_prompt: string
        }
        Returns: {
          out_prompt: string
          out_reveal_state: Database["public"]["Enums"]["reveal_state"]
        }[]
      }
    }
    Enums: {
      answer_kind: "text" | "voice"
      connection_status: "pending" | "linked"
      expiry_state: "active" | "expired" | "saved"
      question_kind: "text" | "voice" | "either"
      relationship_type: "partner" | "friend" | "family"
      reveal_state: "waiting_on_both" | "revealed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      answer_kind: ["text", "voice"],
      connection_status: ["pending", "linked"],
      expiry_state: ["active", "expired", "saved"],
      question_kind: ["text", "voice", "either"],
      relationship_type: ["partner", "friend", "family"],
      reveal_state: ["waiting_on_both", "revealed"],
    },
  },
} as const

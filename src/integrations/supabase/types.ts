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
  public: {
    Tables: {
      edge_rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          user_id: string
          window_start: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      game_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          id: string
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json
          action_type: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string | null
          finished_at: string | null
          host_id: string | null
          id: string
          max_players: number
          room_code: string
          started_at: string | null
          status: Database["public"]["Enums"]["room_status"]
          timer_seconds: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          finished_at?: string | null
          host_id?: string | null
          id?: string
          max_players?: number
          room_code: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          timer_seconds?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          finished_at?: string | null
          host_id?: string | null
          id?: string
          max_players?: number
          room_code?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          timer_seconds?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      game_states: {
        Row: {
          cards_remaining: number
          created_at: string | null
          current_turn_user_id: string | null
          id: string
          phase: Database["public"]["Enums"]["game_phase"]
          room_id: string
          turn_order: string[]
          turn_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          cards_remaining?: number
          created_at?: string | null
          current_turn_user_id?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["game_phase"]
          room_id: string
          turn_order?: string[]
          turn_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cards_remaining?: number
          created_at?: string | null
          current_turn_user_id?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["game_phase"]
          room_id?: string
          turn_order?: string[]
          turn_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          finished_at: string | null
          id: string
          rank: number
          room_id: string | null
          user_id: string | null
          was_setan: boolean
        }
        Insert: {
          finished_at?: string | null
          id?: string
          rank: number
          room_id?: string | null
          user_id?: string | null
          was_setan?: boolean
        }
        Update: {
          finished_at?: string | null
          id?: string
          rank?: number
          room_id?: string | null
          user_id?: string | null
          was_setan?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      player_hands: {
        Row: {
          card_count: number
          cards: Json
          game_state_id: string
          id: string
          is_safe: boolean
          safe_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_count?: number
          cards?: Json
          game_state_id: string
          id?: string
          is_safe?: boolean
          safe_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_count?: number
          cards?: Json
          game_state_id?: string
          id?: string
          is_safe?: boolean
          safe_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_hands_game_state_id_fkey"
            columns: ["game_state_id"]
            isOneToOne: false
            referencedRelation: "game_states"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          id: string
          is_ready: boolean
          joined_at: string | null
          player_order: number | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean
          joined_at?: string | null
          player_order?: number | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean
          joined_at?: string | null
          player_order?: number | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_summary: {
        Row: {
          avg_rank: number | null
          games_played: number | null
          games_safe: number | null
          times_setan: number | null
          user_id: string | null
          username: string | null
          win_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      consume_rate_limit: {
        Args: {
          _action: string
          _limit: number
          _user_id: string
          _window_seconds: number
        }
        Returns: boolean
      }
      generate_room_code: { Args: never; Returns: string }
    }
    Enums: {
      game_phase: "lobby" | "distributing" | "playing" | "finished"
      room_status: "waiting" | "playing" | "finished"
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
      game_phase: ["lobby", "distributing", "playing", "finished"],
      room_status: ["waiting", "playing", "finished"],
    },
  },
} as const

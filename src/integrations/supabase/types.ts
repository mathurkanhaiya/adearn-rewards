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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ad_views: {
        Row: {
          created_at: string
          id: string
          player_id: string
          reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_otps: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          tg_id: number
          used: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          tg_id: number
          used?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          tg_id?: number
          used?: boolean
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          tg_id: number
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          tg_id: number
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          tg_id?: number
          token?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          ad_reward_adr_max: number
          ad_reward_adr_min: number
          ad_reward_max: number
          ad_reward_min: number
          adr_rate: number
          commission_rate: number
          energy_max: number
          energy_regen_sec: number
          features: Json
          free_scratch: number
          free_spins: number
          game_max: number
          game_min: number
          id: number
          login_reward: number
          max_extra_scratch: number
          max_extra_spins: number
          min_swap_adr: number
          min_withdraw: number
          ref_reward_adr_max: number
          ref_reward_adr_min: number
          ref_reward_max: number
          ref_reward_min: number
          req_daily_ads: number
          req_referrals: number
          req_tasks: number
          tap_reward: number
          withdraw_fee: number
        }
        Insert: {
          ad_reward_adr_max?: number
          ad_reward_adr_min?: number
          ad_reward_max?: number
          ad_reward_min?: number
          adr_rate?: number
          commission_rate?: number
          energy_max?: number
          energy_regen_sec?: number
          features?: Json
          free_scratch?: number
          free_spins?: number
          game_max?: number
          game_min?: number
          id?: number
          login_reward?: number
          max_extra_scratch?: number
          max_extra_spins?: number
          min_swap_adr?: number
          min_withdraw?: number
          ref_reward_adr_max?: number
          ref_reward_adr_min?: number
          ref_reward_max?: number
          ref_reward_min?: number
          req_daily_ads?: number
          req_referrals?: number
          req_tasks?: number
          tap_reward?: number
          withdraw_fee?: number
        }
        Update: {
          ad_reward_adr_max?: number
          ad_reward_adr_min?: number
          ad_reward_max?: number
          ad_reward_min?: number
          adr_rate?: number
          commission_rate?: number
          energy_max?: number
          energy_regen_sec?: number
          features?: Json
          free_scratch?: number
          free_spins?: number
          game_max?: number
          game_min?: number
          id?: number
          login_reward?: number
          max_extra_scratch?: number
          max_extra_spins?: number
          min_swap_adr?: number
          min_withdraw?: number
          ref_reward_adr_max?: number
          ref_reward_adr_min?: number
          ref_reward_max?: number
          ref_reward_min?: number
          req_daily_ads?: number
          req_referrals?: number
          req_tasks?: number
          tap_reward?: number
          withdraw_fee?: number
        }
        Relationships: []
      }
      contests: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          metric: string
          reward_amount: number
          reward_type: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          reward_amount?: number
          reward_type?: string
          starts_at?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          reward_amount?: number
          reward_type?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      daily_logins: {
        Row: {
          created_at: string
          day: string
          id: string
          player_id: string
          reward: number
          streak: number
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          player_id: string
          reward?: number
          streak?: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          player_id?: string
          reward?: number
          streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_logins_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_plays: {
        Row: {
          created_at: string
          doubled: boolean
          game: string
          id: string
          player_id: string
          reward: number
        }
        Insert: {
          created_at?: string
          doubled?: boolean
          game: string
          id?: string
          player_id: string
          reward?: number
        }
        Update: {
          created_at?: string
          doubled?: boolean
          game?: string
          id?: string
          player_id?: string
          reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_plays_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          adr_balance: number
          adr_earned: number
          ads_day: string
          ads_watched_today: number
          ads_watched_total: number
          balance: number
          created_at: string
          energy: number
          energy_at: string
          first_name: string | null
          games_day: string
          id: string
          is_banned: boolean
          last_login: string | null
          login_streak: number
          photo_url: string | null
          referral_earned: number
          referrals_count: number
          referred_by: number | null
          scratch_extra: number
          scratch_used: number
          spin_extra: number
          spins_used: number
          taps_today: number
          tasks_completed: number
          tg_id: number
          total_earned: number
          updated_at: string
          usdt_withdrawn: number
          username: string | null
        }
        Insert: {
          adr_balance?: number
          adr_earned?: number
          ads_day?: string
          ads_watched_today?: number
          ads_watched_total?: number
          balance?: number
          created_at?: string
          energy?: number
          energy_at?: string
          first_name?: string | null
          games_day?: string
          id?: string
          is_banned?: boolean
          last_login?: string | null
          login_streak?: number
          photo_url?: string | null
          referral_earned?: number
          referrals_count?: number
          referred_by?: number | null
          scratch_extra?: number
          scratch_used?: number
          spin_extra?: number
          spins_used?: number
          taps_today?: number
          tasks_completed?: number
          tg_id: number
          total_earned?: number
          updated_at?: string
          usdt_withdrawn?: number
          username?: string | null
        }
        Update: {
          adr_balance?: number
          adr_earned?: number
          ads_day?: string
          ads_watched_today?: number
          ads_watched_total?: number
          balance?: number
          created_at?: string
          energy?: number
          energy_at?: string
          first_name?: string | null
          games_day?: string
          id?: string
          is_banned?: boolean
          last_login?: string | null
          login_streak?: number
          photo_url?: string | null
          referral_earned?: number
          referrals_count?: number
          referred_by?: number | null
          scratch_extra?: number
          scratch_used?: number
          spin_extra?: number
          spins_used?: number
          taps_today?: number
          tasks_completed?: number
          tg_id?: number
          total_earned?: number
          updated_at?: string
          usdt_withdrawn?: number
          username?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          kind: string
          max_uses: number
          used_count: number
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          max_uses?: number
          used_count?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          max_uses?: number
          used_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          created_at: string
          id: string
          player_id: string
          promo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          promo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          promo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          verified: boolean
        }
        Insert: {
          bonus?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          verified?: boolean
        }
        Update: {
          bonus?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          player_id: string
          reward: number
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          reward?: number
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          reward?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          chat_username: string | null
          completed_count: number
          created_at: string
          description: string | null
          id: string
          is_live: boolean
          link: string
          reward: number
          task_type: string
          title: string
          user_limit: number
        }
        Insert: {
          chat_username?: string | null
          completed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          link: string
          reward?: number
          task_type?: string
          title: string
          user_limit?: number
        }
        Update: {
          chat_username?: string | null
          completed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          link?: string
          reward?: number
          task_type?: string
          title?: string
          user_limit?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          note: string | null
          player_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          player_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          address: string
          amount: number
          created_at: string
          fee: number
          id: string
          method: string
          net_amount: number
          player_id: string
          processed_at: string | null
          reason: string | null
          status: string
        }
        Insert: {
          address: string
          amount: number
          created_at?: string
          fee?: number
          id?: string
          method: string
          net_amount: number
          player_id: string
          processed_at?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          address?: string
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          method?: string
          net_amount?: number
          player_id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

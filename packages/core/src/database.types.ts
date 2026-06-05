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
      accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          name: string | null
          phone: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          body_type: string | null
          brand: string
          color: string | null
          created_at: string | null
          engine_type: string | null
          euro_standard: string | null
          fuel_type: string | null
          id: number
          license_plate: string | null
          model: string
          notes: string | null
          tire_brand: string | null
          tire_diameter: number | null
          tire_dot: string | null
          tire_height: number | null
          tire_season: string | null
          tire_width: number | null
          updated_at: string | null
          user_id: number
          vin: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          brand: string
          color?: string | null
          created_at?: string | null
          engine_type?: string | null
          euro_standard?: string | null
          fuel_type?: string | null
          id?: number
          license_plate?: string | null
          model: string
          notes?: string | null
          tire_brand?: string | null
          tire_diameter?: number | null
          tire_dot?: string | null
          tire_height?: number | null
          tire_season?: string | null
          tire_width?: number | null
          updated_at?: string | null
          user_id: number
          vin?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          brand?: string
          color?: string | null
          created_at?: string | null
          engine_type?: string | null
          euro_standard?: string | null
          fuel_type?: string | null
          id?: number
          license_plate?: string | null
          model?: string
          notes?: string | null
          tire_brand?: string | null
          tire_diameter?: number | null
          tire_dot?: string | null
          tire_height?: number | null
          tire_season?: string | null
          tire_width?: number | null
          updated_at?: string | null
          user_id?: number
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          id: number
          mime_type: string | null
          name: string
          path: string
          service_id: number
          size_bytes: number | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          mime_type?: string | null
          name: string
          path: string
          service_id: number
          size_bytes?: number | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          mime_type?: string | null
          name?: string
          path?: string
          service_id?: number
          size_bytes?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: number
          platform: string | null
          token: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_logs: {
        Row: {
          car_id: number | null
          created_at: string | null
          email: string | null
          expiry_date: string | null
          id: number
          sent_at: string | null
          service_type: string | null
          user_id: number | null
        }
        Insert: {
          car_id?: number | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          id?: number
          sent_at?: string | null
          service_type?: string | null
          user_id?: number | null
        }
        Update: {
          car_id?: number | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          id?: number
          sent_at?: string | null
          service_type?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_logs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          car_id: number
          cost: number | null
          created_at: string | null
          expiry_date: string | null
          file_url: string | null
          fuel_type: string | null
          id: number
          last_check_source: string | null
          last_check_status: string | null
          last_checked_at: string | null
          liters: number | null
          mileage: number | null
          notes: string | null
          price_per_liter: number | null
          reminder_sent: boolean | null
          service_type: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          car_id: number
          cost?: number | null
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          fuel_type?: string | null
          id?: number
          last_check_source?: string | null
          last_check_status?: string | null
          last_checked_at?: string | null
          liters?: number | null
          mileage?: number | null
          notes?: string | null
          price_per_liter?: number | null
          reminder_sent?: boolean | null
          service_type: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          car_id?: number
          cost?: number | null
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          fuel_type?: string | null
          id?: number
          last_check_source?: string | null
          last_check_status?: string | null
          last_checked_at?: string | null
          liters?: number | null
          mileage?: number | null
          notes?: string | null
          price_per_liter?: number | null
          reminder_sent?: boolean | null
          service_type?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_channel: string | null
          billing_period: string | null
          current_period_end: string | null
          plan: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          billing_channel?: string | null
          billing_period?: string | null
          current_period_end?: string | null
          plan?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          billing_channel?: string | null
          billing_period?: string | null
          current_period_end?: string | null
          plan?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          google_id: string | null
          id: number
          is_admin: boolean | null
          name: string | null
          password: string | null
          reminder_days: number | null
          reminder_enabled: boolean | null
          reminder_settings: Json | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          google_id?: string | null
          id?: number
          is_admin?: boolean | null
          name?: string | null
          password?: string | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          reminder_settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          google_id?: string | null
          id?: number
          is_admin?: boolean | null
          name?: string | null
          password?: string | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          reminder_settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

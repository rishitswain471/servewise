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
      demand_forecasts: {
        Row: {
          buffer: number
          consumption_rate: number
          created_at: string
          created_by: string | null
          expected_attendance: number
          forecast_demand: number
          history_count: number
          history_status: string
          id: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          method_version: string
          organization_id: string
          recommended_preparation: number
          service_date: string
          updated_at: string
        }
        Insert: {
          buffer: number
          consumption_rate: number
          created_at?: string
          created_by?: string | null
          expected_attendance: number
          forecast_demand: number
          history_count: number
          history_status: string
          id?: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          method_version: string
          organization_id: string
          recommended_preparation: number
          service_date: string
          updated_at?: string
        }
        Update: {
          buffer?: number
          consumption_rate?: number
          created_at?: string
          created_by?: string | null
          expected_attendance?: number
          forecast_demand?: number
          history_count?: number
          history_status?: string
          id?: string
          meal_period?: Database["public"]["Enums"]["meal_period"]
          menu_name?: string
          method_version?: string
          organization_id?: string
          recommended_preparation?: number
          service_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_assumptions: {
        Row: {
          co2e_kg_per_meal: number
          financial_per_meal: number
          organization_id: string
          social_per_meal: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          co2e_kg_per_meal?: number
          financial_per_meal?: number
          organization_id: string
          social_per_meal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          co2e_kg_per_meal?: number
          financial_per_meal?: number
          organization_id?: string
          social_per_meal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_assumptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          closed_at: string | null
          created_by: string | null
          file_name: string
          id: string
          imported_at: string
          organization_id: string
          record_count: number
          replaces_batch_id: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          created_by?: string | null
          file_name: string
          id?: string
          imported_at?: string
          organization_id: string
          record_count: number
          replaces_batch_id?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          created_by?: string | null
          file_name?: string
          id?: string
          imported_at?: string
          organization_id?: string
          record_count?: number
          replaces_batch_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_replaces_batch_id_fkey"
            columns: ["replaces_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      recipient_offers: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          handling_info: string
          id: string
          kitchen_name: string
          kitchen_org_id: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          picked_up_at: string | null
          pickup_date: string
          pickup_from: string
          pickup_notes: string | null
          pickup_owner: string | null
          pickup_scheduled_at: string | null
          pickup_until: string
          quantity: number
          received_at: string | null
          received_quantity: number | null
          recipient_name: string
          recipient_org_id: string
          responded_at: string | null
          service_date: string
          status: string
          surplus_batch_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          handling_info: string
          id?: string
          kitchen_name: string
          kitchen_org_id: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          picked_up_at?: string | null
          pickup_date: string
          pickup_from: string
          pickup_notes?: string | null
          pickup_owner?: string | null
          pickup_scheduled_at?: string | null
          pickup_until: string
          quantity: number
          received_at?: string | null
          received_quantity?: number | null
          recipient_name: string
          recipient_org_id: string
          responded_at?: string | null
          service_date: string
          status?: string
          surplus_batch_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          handling_info?: string
          id?: string
          kitchen_name?: string
          kitchen_org_id?: string
          meal_period?: Database["public"]["Enums"]["meal_period"]
          menu_name?: string
          picked_up_at?: string | null
          pickup_date?: string
          pickup_from?: string
          pickup_notes?: string | null
          pickup_owner?: string | null
          pickup_scheduled_at?: string | null
          pickup_until?: string
          quantity?: number
          received_at?: string | null
          received_quantity?: number | null
          recipient_name?: string
          recipient_org_id?: string
          responded_at?: string | null
          service_date?: string
          status?: string
          surplus_batch_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipient_offers_kitchen_org_id_fkey"
            columns: ["kitchen_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipient_offers_recipient_org_id_fkey"
            columns: ["recipient_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipient_offers_surplus_batch_id_fkey"
            columns: ["surplus_batch_id"]
            isOneToOne: false
            referencedRelation: "surplus_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      recipient_profiles: {
        Row: {
          accepted_food_types: string[]
          accepting_offers: boolean
          capacity_meals: number
          created_at: string
          display_name: string
          organization_id: string
          pickup_contact: string
          pickup_from: string
          pickup_notes: string | null
          pickup_until: string
          service_area: string
          updated_at: string
        }
        Insert: {
          accepted_food_types?: string[]
          accepting_offers?: boolean
          capacity_meals: number
          created_at?: string
          display_name: string
          organization_id: string
          pickup_contact: string
          pickup_from: string
          pickup_notes?: string | null
          pickup_until: string
          service_area: string
          updated_at?: string
        }
        Update: {
          accepted_food_types?: string[]
          accepting_offers?: boolean
          capacity_meals?: number
          created_at?: string
          display_name?: string
          organization_id?: string
          pickup_contact?: string
          pickup_from?: string
          pickup_notes?: string | null
          pickup_until?: string
          service_area?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipient_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_policies: {
        Row: {
          max_cold_holding_c: number
          max_holding_minutes: number
          min_hot_holding_c: number
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          max_cold_holding_c?: number
          max_holding_minutes?: number
          min_hot_holding_c?: number
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          max_cold_holding_c?: number
          max_holding_minutes?: number
          min_hot_holding_c?: number
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_verifications: {
        Row: {
          basis: Json
          handling_notes: string
          holding_minutes: number
          id: string
          organization_id: string
          outcome: string
          policy_snapshot: Json
          reviewed_at: string
          reviewed_by: string
          reviewer_email: string | null
          storage_mode: string
          surplus_batch_id: string
          temperature_c: number
        }
        Insert: {
          basis: Json
          handling_notes: string
          holding_minutes: number
          id?: string
          organization_id: string
          outcome: string
          policy_snapshot: Json
          reviewed_at?: string
          reviewed_by: string
          reviewer_email?: string | null
          storage_mode: string
          surplus_batch_id: string
          temperature_c: number
        }
        Update: {
          basis?: Json
          handling_notes?: string
          holding_minutes?: number
          id?: string
          organization_id?: string
          outcome?: string
          policy_snapshot?: Json
          reviewed_at?: string
          reviewed_by?: string
          reviewer_email?: string | null
          storage_mode?: string
          surplus_batch_id?: string
          temperature_c?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_verifications_surplus_batch_id_fkey"
            columns: ["surplus_batch_id"]
            isOneToOne: true
            referencedRelation: "surplus_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          actual_attendance: number | null
          consumed_quantity: number | null
          created_at: string
          created_by: string | null
          expected_attendance: number | null
          id: string
          import_batch_id: string | null
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          notes: string | null
          organization_id: string
          prepared_quantity: number | null
          service_completed_at: string | null
          service_date: string
          updated_at: string
        }
        Insert: {
          actual_attendance?: number | null
          consumed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          expected_attendance?: number | null
          id?: string
          import_batch_id?: string | null
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          notes?: string | null
          organization_id: string
          prepared_quantity?: number | null
          service_completed_at?: string | null
          service_date: string
          updated_at?: string
        }
        Update: {
          actual_attendance?: number | null
          consumed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          expected_attendance?: number | null
          id?: string
          import_batch_id?: string | null
          meal_period?: Database["public"]["Enums"]["meal_period"]
          menu_name?: string
          notes?: string | null
          organization_id?: string
          prepared_quantity?: number | null
          service_completed_at?: string | null
          service_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      surplus_batches: {
        Row: {
          consumed_quantity: number
          created_at: string
          created_by: string | null
          id: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          organization_id: string
          potential_surplus: number
          prepared_quantity: number
          service_date: string
          service_record_id: string
          status: string
          updated_at: string
        }
        Insert: {
          consumed_quantity: number
          created_at?: string
          created_by?: string | null
          id?: string
          meal_period: Database["public"]["Enums"]["meal_period"]
          menu_name: string
          organization_id: string
          potential_surplus: number
          prepared_quantity: number
          service_date: string
          service_record_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          consumed_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          meal_period?: Database["public"]["Enums"]["meal_period"]
          menu_name?: string
          organization_id?: string
          potential_surplus?: number
          prepared_quantity?: number
          service_date?: string
          service_record_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surplus_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surplus_batches_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: true
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_recipient_offer: {
        Args: {
          _action: string
          _notes?: string
          _offer: string
          _owner?: string
          _received?: number
          _when?: string
        }
        Returns: string
      }
      create_organization: {
        Args: { _name: string; _type: Database["public"]["Enums"]["org_type"] }
        Returns: string
      }
      create_recipient_offer: {
        Args: {
          _batch: string
          _from: string
          _pickup_date: string
          _quantity: number
          _recipient: string
          _until: string
        }
        Returns: string
      }
      import_service_records: {
        Args: {
          _file_name: string
          _org: string
          _replace?: string
          _rows: Json
        }
        Returns: string
      }
      is_any_kitchen_admin: { Args: never; Returns: boolean }
      is_kitchen_admin: { Args: { _org: string }; Returns: boolean }
      is_ngo_admin: { Args: { _org: string }; Returns: boolean }
      is_org_admin: { Args: { _org: string }; Returns: boolean }
      is_org_member: { Args: { _org: string }; Returns: boolean }
      record_safety_check: {
        Args: {
          _batch: string
          _holding_minutes: number
          _notes: string
          _storage_mode: string
          _temperature: number
        }
        Returns: string
      }
      refresh_batch_status: { Args: { _batch: string }; Returns: undefined }
      remove_import_batch: {
        Args: { _batch: string; _org: string }
        Returns: number
      }
      send_to_surplus_rescue: { Args: { _record: string }; Returns: string }
      upsert_recipient_profile: {
        Args: {
          _accepting: boolean
          _area: string
          _capacity: number
          _contact: string
          _food_types: string[]
          _from: string
          _notes: string
          _org: string
          _until: string
        }
        Returns: undefined
      }
    }
    Enums: {
      meal_period: "breakfast" | "lunch" | "dinner"
      org_role: "admin" | "member"
      org_type: "kitchen" | "ngo"
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
  public: {
    Enums: {
      meal_period: ["breakfast", "lunch", "dinner"],
      org_role: ["admin", "member"],
      org_type: ["kitchen", "ngo"],
    },
  },
} as const

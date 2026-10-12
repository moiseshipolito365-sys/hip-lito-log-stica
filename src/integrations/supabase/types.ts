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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string
          entity: string
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          amount: number
          created_at: string
          external_id: string | null
          id: string
          notes: string | null
          source: string
          status: string
          transferred_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_id?: string | null
          id?: string
          notes?: string | null
          source?: string
          status?: string
          transferred_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string | null
          id?: string
          notes?: string | null
          source?: string
          status?: string
          transferred_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_settings: {
        Row: {
          fixed_fee: number
          marketplace_fee_pct: number
          other_pct: number
          packaging_cost: number
          shipping_cost: number
          target_margin_pct: number
          tax_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          fixed_fee?: number
          marketplace_fee_pct?: number
          other_pct?: number
          packaging_cost?: number
          shipping_cost?: number
          target_margin_pct?: number
          tax_pct?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          fixed_fee?: number
          marketplace_fee_pct?: number
          other_pct?: number
          packaging_cost?: number
          shipping_cost?: number
          target_margin_pct?: number
          tax_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          error_message: string | null
          external_id: string | null
          external_url: string | null
          id: string
          photos: string[]
          price: number
          product_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          photos?: string[]
          price?: number
          product_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          photos?: string[]
          price?: number
          product_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability: string
          category: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          sale_price: number
          sku: string | null
          stock: number | null
          supplier_id: string | null
          supplier_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          sale_price?: number
          sku?: string | null
          stock?: number | null
          supplier_id?: string | null
          supplier_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          availability?: string
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          sale_price?: number
          sku?: string | null
          stock?: number | null
          supplier_id?: string | null
          supplier_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          advertising_cost: number
          created_at: string
          description: string
          external_id: string | null
          id: string
          marketplace_fees: number
          notes: string | null
          other_costs: number
          packaging_cost: number
          payment_status: string
          product_id: string | null
          quantity: number
          refunded_amount: number
          released_at: string | null
          shipping_cost: number
          sold_at: string
          source: string
          unit_cost: number | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advertising_cost?: number
          created_at?: string
          description: string
          external_id?: string | null
          id?: string
          marketplace_fees?: number
          notes?: string | null
          other_costs?: number
          packaging_cost?: number
          payment_status?: string
          product_id?: string | null
          quantity?: number
          refunded_amount?: number
          released_at?: string | null
          shipping_cost?: number
          sold_at?: string
          source?: string
          unit_cost?: number | null
          unit_price: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          advertising_cost?: number
          created_at?: string
          description?: string
          external_id?: string | null
          id?: string
          marketplace_fees?: number
          notes?: string | null
          other_costs?: number
          packaging_cost?: number
          payment_status?: string
          product_id?: string | null
          quantity?: number
          refunded_amount?: number
          released_at?: string | null
          shipping_cost?: number
          sold_at?: string
          source?: string
          unit_cost?: number | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          catalog_url: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          catalog_url?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Update: {
          catalog_url?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const

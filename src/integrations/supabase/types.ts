export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          plan: Database["public"]["Enums"]["plan_type"]
          credit_balance: number
          monthly_credit_limit: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["plan_type"]
          credit_balance?: number
          monthly_credit_limit?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          credit_balance?: number
          monthly_credit_limit?: number
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          org_id: string
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          email: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      integrations: {
        Row: {
          id: string
          org_id: string
          platform: string
          auth_token_enc: string | null
          status: Database["public"]["Enums"]["integration_status"]
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          platform: string
          auth_token_enc?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          platform?: string
          auth_token_enc?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      workflows: {
        Row: {
          id: string
          org_id: string
          created_by: string
          name: string
          nl_description: string | null
          agent_plan_json: Json | null
          status: Database["public"]["Enums"]["workflow_status"]
          trigger_type: string
          success_rate: number
          avg_execution_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          name: string
          nl_description?: string | null
          agent_plan_json?: Json | null
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_type?: string
          success_rate?: number
          avg_execution_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          created_by?: string
          name?: string
          nl_description?: string | null
          agent_plan_json?: Json | null
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_type?: string
          success_rate?: number
          avg_execution_ms?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_runs: {
        Row: {
          id: string
          workflow_id: string
          status: Database["public"]["Enums"]["run_status"]
          steps_json: Json
          credits_consumed: number
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          workflow_id: string
          status?: Database["public"]["Enums"]["run_status"]
          steps_json?: Json
          credits_consumed?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string
          status?: Database["public"]["Enums"]["run_status"]
          steps_json?: Json
          credits_consumed?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          org_id: string
          type: Database["public"]["Enums"]["txn_type"]
          amount: number
          razorpay_payment_id: string | null
          workflow_run_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          type: Database["public"]["Enums"]["txn_type"]
          amount: number
          razorpay_payment_id?: string | null
          workflow_run_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          type?: Database["public"]["Enums"]["txn_type"]
          amount?: number
          razorpay_payment_id?: string | null
          workflow_run_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_org_id: string
          p_amount: number
          p_run_id?: string
        }
        Returns: Json
      }
      topup_credits: {
        Args: {
          p_org_id: string
          p_amount: number
          p_razorpay_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      plan_type: "free" | "pro" | "enterprise"
      user_role: "admin" | "member" | "viewer"
      integration_status: "connected" | "expired" | "error"
      workflow_status: "draft" | "active" | "paused" | "failed"
      run_status: "running" | "success" | "failed" | "needs_approval"
      txn_type: "purchase" | "usage" | "refund" | "monthly_grant"
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
      plan_type: ["free", "pro", "enterprise"] as const,
      user_role: ["admin", "member", "viewer"] as const,
      integration_status: ["connected", "expired", "error"] as const,
      workflow_status: ["draft", "active", "paused", "failed"] as const,
      run_status: ["running", "success", "failed", "needs_approval"] as const,
      txn_type: ["purchase", "usage", "refund", "monthly_grant"] as const,
    },
  },
} as const

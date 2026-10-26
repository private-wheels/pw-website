// Generated from the Supabase schema (MCP `generate_typescript_types`), trimmed
// to the parts the app uses. Regenerate after schema changes.

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      listings: {
        Row: {
          approved_at: string | null;
          edited_at: string | null;
          fee_waived: boolean;
          review_note: string;
          reviewed_by: string | null;
          accident_history: string;
          body_type: string;
          colour: string;
          condition: string;
          created_at: string;
          description: string;
          featured: boolean;
          features: string[];
          fuel_type: string;
          id: string;
          images: string[];
          make: string;
          mileage: number;
          model: string;
          original_price: number | null;
          paid_at: string | null;
          previous_owners: number;
          price: number;
          province: string;
          seller_id: string | null;
          seller_name: string;
          seller_phone: string;
          service_history: string;
          status: string;
          town: string;
          transmission: string;
          updated_at: string;
          variant: string;
          year: number;
        };
        Insert: {
          approved_at?: string | null;
          edited_at?: string | null;
          fee_waived?: boolean;
          review_note?: string;
          reviewed_by?: string | null;
          accident_history: string;
          body_type: string;
          colour?: string;
          condition: string;
          created_at?: string;
          description?: string;
          featured?: boolean;
          features?: string[];
          fuel_type: string;
          id?: string;
          images?: string[];
          make: string;
          mileage?: number;
          model: string;
          original_price?: number | null;
          paid_at?: string | null;
          previous_owners?: number;
          price: number;
          province: string;
          seller_id?: string | null;
          seller_name: string;
          seller_phone?: string;
          service_history: string;
          status?: string;
          town?: string;
          transmission: string;
          updated_at?: string;
          variant?: string;
          year: number;
        };
        Update: {
          approved_at?: string | null;
          edited_at?: string | null;
          fee_waived?: boolean;
          review_note?: string;
          reviewed_by?: string | null;
          accident_history?: string;
          body_type?: string;
          colour?: string;
          condition?: string;
          created_at?: string;
          description?: string;
          featured?: boolean;
          features?: string[];
          fuel_type?: string;
          id?: string;
          images?: string[];
          make?: string;
          mileage?: number;
          model?: string;
          original_price?: number | null;
          paid_at?: string | null;
          previous_owners?: number;
          price?: number;
          province?: string;
          seller_id?: string | null;
          seller_name?: string;
          seller_phone?: string;
          service_history?: string;
          status?: string;
          town?: string;
          transmission?: string;
          updated_at?: string;
          variant?: string;
          year?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          refund_note: string;
          refunded_at: string | null;
          amount_cents: number;
          channel: string | null;
          created_at: string;
          currency: string;
          id: string;
          listing_id: string | null;
          paid_at: string | null;
          paystack_transaction_id: number | null;
          reference: string;
          seller_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          refund_note?: string;
          refunded_at?: string | null;
          amount_cents: number;
          channel?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          listing_id?: string | null;
          paid_at?: string | null;
          paystack_transaction_id?: number | null;
          reference: string;
          seller_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          refund_note?: string;
          refunded_at?: string | null;
          amount_cents?: number;
          channel?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          listing_id?: string | null;
          paid_at?: string | null;
          paystack_transaction_id?: number | null;
          reference?: string;
          seller_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          role: string;
          created_at: string;
          display_name: string;
          id: string;
          phone: string;
        };
        Insert: {
          role?: string;
          created_at?: string;
          display_name?: string;
          id: string;
          phone?: string;
        };
        Update: {
          role?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          phone?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

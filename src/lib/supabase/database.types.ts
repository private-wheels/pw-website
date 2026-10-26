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
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          phone: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          phone?: string;
        };
        Update: {
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          checked: boolean | null
          content: string | null
          icon: string | null
          id: string
          page_id: string
          sort_order: number
          type: string
        }
        Insert: {
          checked?: boolean | null
          content?: string | null
          icon?: string | null
          id?: string
          page_id: string
          sort_order?: number
          type: string
        }
        Update: {
          checked?: boolean | null
          content?: string | null
          icon?: string | null
          id?: string
          page_id?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          cover_url: string | null
          created_at: string
          icon: string
          id: string
          is_favorite: boolean
          parent_id: string | null
          sidebar_section: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          icon?: string
          id?: string
          is_favorite?: boolean
          parent_id?: string | null
          sidebar_section?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          icon?: string
          id?: string
          is_favorite?: boolean
          parent_id?: string | null
          sidebar_section?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      move_block: {
        Args: { p_block_id: string; p_direction: string; p_page_id: string }
        Returns: undefined
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

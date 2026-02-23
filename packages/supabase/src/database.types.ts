export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string | null
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string | null
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string | null
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string | null
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string | null
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["admin_action_enum"]
          admin_user_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["admin_action_enum"]
          admin_user_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["admin_action_enum"]
          admin_user_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string | null
          id: string
          personal_message: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          id?: string
          personal_message?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          id?: string
          personal_message?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string | null
          muted: boolean | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          muted?: boolean | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          muted?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          room_id: string | null
          type: Database["public"]["Enums"]["conversation_type_enum"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          type?: Database["public"]["Enums"]["conversation_type_enum"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          type?: Database["public"]["Enums"]["conversation_type_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hospi_events: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          max_attendees: number | null
          notes: string | null
          room_id: string | null
          rsvp_deadline: string | null
          time_end: string | null
          time_start: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          notes?: string | null
          room_id?: string | null
          rsvp_deadline?: string | null
          time_end?: string | null
          time_start: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          notes?: string | null
          room_id?: string | null
          rsvp_deadline?: string | null
          time_end?: string | null
          time_start?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospi_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospi_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hospi_invitations: {
        Row: {
          application_id: string | null
          decline_reason: string | null
          event_id: string | null
          id: string
          invited_at: string | null
          reminder_sent_at: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invitation_status_enum"] | null
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          decline_reason?: string | null
          event_id?: string | null
          id?: string
          invited_at?: string | null
          reminder_sent_at?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status_enum"] | null
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          decline_reason?: string | null
          event_id?: string | null
          id?: string
          invited_at?: string | null
          reminder_sent_at?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status_enum"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospi_invitations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospi_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hospi_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospi_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      housemates: {
        Row: {
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["housemate_role_enum"] | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["housemate_role_enum"] | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["housemate_role_enum"] | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "housemates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housemates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_receipts: {
        Row: {
          delivered_at: string | null
          message_id: string
          read_at: string | null
          status: Database["public"]["Enums"]["delivery_status_enum"] | null
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          message_id: string
          read_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          message_id?: string
          read_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ciphertext: string
          conversation_id: string | null
          created_at: string | null
          id: string
          iv: string
          message_type: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id: string | null
        }
        Insert: {
          ciphertext: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          iv: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id?: string | null
        }
        Update: {
          ciphertext?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          iv?: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          sent: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          sent?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          sent?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_key_backups: {
        Row: {
          backup_iv: string
          backup_key: string
          created_at: string | null
          encrypted_private_key: string
          user_id: string
        }
        Insert: {
          backup_iv: string
          backup_key: string
          created_at?: string | null
          encrypted_private_key: string
          user_id: string
        }
        Update: {
          backup_iv?: string
          backup_key?: string
          created_at?: string | null
          encrypted_private_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_key_backups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliation: Database["public"]["Enums"]["affiliation_enum"] | null
          available_from: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          faculty: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          instagram_handle: string | null
          institution_domain: string
          languages: Database["public"]["Enums"]["language_enum"][] | null
          last_login_at: string | null
          last_name: string
          lifestyle_tags:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          max_rent: number | null
          notification_preferences: Json | null
          preferred_city: Database["public"]["Enums"]["city_enum"] | null
          role: string | null
          show_instagram: boolean | null
          study_program: string | null
          study_year: number | null
          updated_at: string | null
          vereniging: string | null
        }
        Insert: {
          affiliation?: Database["public"]["Enums"]["affiliation_enum"] | null
          available_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          faculty?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          instagram_handle?: string | null
          institution_domain: string
          languages?: Database["public"]["Enums"]["language_enum"][] | null
          last_login_at?: string | null
          last_name: string
          lifestyle_tags?:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          max_rent?: number | null
          notification_preferences?: Json | null
          preferred_city?: Database["public"]["Enums"]["city_enum"] | null
          role?: string | null
          show_instagram?: boolean | null
          study_program?: string | null
          study_year?: number | null
          updated_at?: string | null
          vereniging?: string | null
        }
        Update: {
          affiliation?: Database["public"]["Enums"]["affiliation_enum"] | null
          available_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          faculty?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id?: string
          instagram_handle?: string | null
          institution_domain?: string
          languages?: Database["public"]["Enums"]["language_enum"][] | null
          last_login_at?: string | null
          last_name?: string
          lifestyle_tags?:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          max_rent?: number | null
          notification_preferences?: Json | null
          preferred_city?: Database["public"]["Enums"]["city_enum"] | null
          role?: string | null
          show_instagram?: boolean | null
          study_program?: string | null
          study_year?: number | null
          updated_at?: string | null
          vereniging?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      public_keys: {
        Row: {
          created_at: string | null
          public_key_jwk: Json
          rotated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          public_key_jwk: Json
          rotated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          public_key_jwk?: Json
          rotated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          active: boolean | null
          created_at: string | null
          device_type: string | null
          expo_push_token: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          device_type?: string | null
          expo_push_token: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          device_type?: string | null
          expo_push_token?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          decrypted_message_text: string | null
          description: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason_enum"]
          reported_message_id: string | null
          reported_room_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Insert: {
          created_at?: string | null
          decrypted_message_text?: string | null
          description?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason_enum"]
          reported_message_id?: string | null
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Update: {
          created_at?: string | null
          decrypted_message_text?: string | null
          description?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason_enum"]
          reported_message_id?: string | null
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_message_id_fkey"
            columns: ["reported_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_room_id_fkey"
            columns: ["reported_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          applicant_id: string | null
          decision: Database["public"]["Enums"]["review_decision_enum"] | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          room_id: string | null
        }
        Insert: {
          applicant_id?: string | null
          decision?: Database["public"]["Enums"]["review_decision_enum"] | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          room_id?: string | null
        }
        Update: {
          applicant_id?: string | null
          decision?: Database["public"]["Enums"]["review_decision_enum"] | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          accepted_languages:
            | Database["public"]["Enums"]["language_enum"][]
            | null
          address: string | null
          available_from: string | null
          available_until: string | null
          city: Database["public"]["Enums"]["city_enum"]
          created_at: string | null
          created_by: string
          deposit: number | null
          description: string | null
          features: Database["public"]["Enums"]["room_feature_enum"][] | null
          furnishing: Database["public"]["Enums"]["furnishing_enum"] | null
          house_type: Database["public"]["Enums"]["house_type_enum"] | null
          id: string
          is_verenigingshuis: boolean | null
          location_tags:
            | Database["public"]["Enums"]["location_tag_enum"][]
            | null
          neighborhood: string | null
          photos: string[] | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          preferred_gender:
            | Database["public"]["Enums"]["gender_preference_enum"]
            | null
          preferred_lifestyle_tags:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          rent_price: number
          rental_type: Database["public"]["Enums"]["rental_type_enum"] | null
          room_size_m2: number | null
          room_vereniging: string | null
          share_link: string | null
          share_link_expires_at: string | null
          share_link_max_uses: number | null
          share_link_use_count: number | null
          status: Database["public"]["Enums"]["room_status_enum"] | null
          title: string
          total_housemates: number | null
          updated_at: string | null
          utilities_included: boolean | null
        }
        Insert: {
          accepted_languages?:
            | Database["public"]["Enums"]["language_enum"][]
            | null
          address?: string | null
          available_from?: string | null
          available_until?: string | null
          city: Database["public"]["Enums"]["city_enum"]
          created_at?: string | null
          created_by: string
          deposit?: number | null
          description?: string | null
          features?: Database["public"]["Enums"]["room_feature_enum"][] | null
          furnishing?: Database["public"]["Enums"]["furnishing_enum"] | null
          house_type?: Database["public"]["Enums"]["house_type_enum"] | null
          id?: string
          is_verenigingshuis?: boolean | null
          location_tags?:
            | Database["public"]["Enums"]["location_tag_enum"][]
            | null
          neighborhood?: string | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_gender?:
            | Database["public"]["Enums"]["gender_preference_enum"]
            | null
          preferred_lifestyle_tags?:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          rent_price: number
          rental_type?: Database["public"]["Enums"]["rental_type_enum"] | null
          room_size_m2?: number | null
          room_vereniging?: string | null
          share_link?: string | null
          share_link_expires_at?: string | null
          share_link_max_uses?: number | null
          share_link_use_count?: number | null
          status?: Database["public"]["Enums"]["room_status_enum"] | null
          title: string
          total_housemates?: number | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Update: {
          accepted_languages?:
            | Database["public"]["Enums"]["language_enum"][]
            | null
          address?: string | null
          available_from?: string | null
          available_until?: string | null
          city?: Database["public"]["Enums"]["city_enum"]
          created_at?: string | null
          created_by?: string
          deposit?: number | null
          description?: string | null
          features?: Database["public"]["Enums"]["room_feature_enum"][] | null
          furnishing?: Database["public"]["Enums"]["furnishing_enum"] | null
          house_type?: Database["public"]["Enums"]["house_type_enum"] | null
          id?: string
          is_verenigingshuis?: boolean | null
          location_tags?:
            | Database["public"]["Enums"]["location_tag_enum"][]
            | null
          neighborhood?: string | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_gender?:
            | Database["public"]["Enums"]["gender_preference_enum"]
            | null
          preferred_lifestyle_tags?:
            | Database["public"]["Enums"]["lifestyle_tag_enum"][]
            | null
          rent_price?: number
          rental_type?: Database["public"]["Enums"]["rental_type_enum"] | null
          room_size_m2?: number | null
          room_vereniging?: string | null
          share_link?: string | null
          share_link_expires_at?: string | null
          share_link_max_uses?: number | null
          share_link_use_count?: number | null
          status?: Database["public"]["Enums"]["room_status_enum"] | null
          title?: string
          total_housemates?: number | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string | null
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt?: string | null
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string | null
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ssoProvider: {
        Row: {
          domain: string | null
          id: string
          issuer: string | null
          oidcConfig: string | null
          organizationId: string | null
          providerId: string
          samlConfig: string | null
          userId: string | null
        }
        Insert: {
          domain?: string | null
          id: string
          issuer?: string | null
          oidcConfig?: string | null
          organizationId?: string | null
          providerId: string
          samlConfig?: string | null
          userId?: string | null
        }
        Update: {
          domain?: string | null
          id?: string
          issuer?: string | null
          oidcConfig?: string | null
          organizationId?: string | null
          providerId?: string
          samlConfig?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssoProvider_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string | null
          email: string
          emailVerified: boolean | null
          id: string
          image: string | null
          name: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          emailVerified?: boolean | null
          id: string
          image?: string | null
          name: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          emailVerified?: boolean | null
          id?: string
          image?: string | null
          name?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string | null
          value: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string | null
          value: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string | null
          value?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          applicant_id: string | null
          created_at: string | null
          id: string
          rank: number | null
          room_id: string | null
          round: number | null
          voter_id: string | null
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          room_id?: string | null
          round?: number | null
          voter_id?: string | null
        }
        Update: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          room_id?: string | null
          round?: number | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_housemate: {
        Args: {
          _roles?: Database["public"]["Enums"]["housemate_role_enum"][]
          _room_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_action_enum:
        | "view_report"
        | "suspend_user"
        | "unsuspend_user"
        | "remove_listing"
        | "remove_message"
        | "dismiss_report"
      affiliation_enum: "student" | "employee" | "staff"
      application_status_enum:
        | "sent"
        | "seen"
        | "liked"
        | "maybe"
        | "rejected"
        | "invited"
        | "attending"
        | "not_attending"
        | "accepted"
        | "not_chosen"
        | "withdrawn"
      city_enum:
        | "amsterdam"
        | "rotterdam"
        | "den_haag"
        | "utrecht"
        | "groningen"
        | "eindhoven"
        | "tilburg"
        | "nijmegen"
        | "enschede"
        | "arnhem"
        | "leiden"
        | "maastricht"
        | "delft"
        | "breda"
        | "leeuwarden"
        | "zwolle"
        | "den_bosch"
        | "haarlem"
        | "wageningen"
        | "middelburg"
        | "vlissingen"
        | "deventer"
        | "apeldoorn"
        | "amersfoort"
        | "almere"
        | "dordrecht"
        | "heerlen"
        | "sittard"
        | "venlo"
        | "helmond"
        | "anders"
      conversation_type_enum: "direct" | "group" | "house"
      delivery_status_enum: "sent" | "delivered" | "read"
      furnishing_enum: "kaal" | "gestoffeerd" | "gemeubileerd"
      gender_enum: "man" | "vrouw" | "zeg_ik_liever_niet"
      gender_preference_enum: "man" | "vrouw" | "geen_voorkeur"
      house_type_enum:
        | "studentenhuis"
        | "appartement"
        | "studio"
        | "woongroep"
        | "anti_kraak"
      housemate_role_enum: "owner" | "admin" | "member"
      invitation_status_enum:
        | "pending"
        | "attending"
        | "not_attending"
        | "maybe"
      language_enum:
        | "nl"
        | "en"
        | "de"
        | "fr"
        | "es"
        | "it"
        | "pt"
        | "zh"
        | "ar"
        | "tr"
        | "pl"
        | "hi"
        | "ja"
        | "ko"
      lifestyle_tag_enum:
        | "gezellig"
        | "rustig"
        | "introvert"
        | "extravert"
        | "sporten"
        | "koken"
        | "gamen"
        | "muziek"
        | "uitgaan"
        | "feesten"
        | "studeren"
        | "lezen"
        | "reizen"
        | "filmavond"
        | "creatief"
        | "vroege_vogel"
        | "nachtbraker"
        | "schoon"
        | "relaxed_met_schoonmaken"
        | "vegetarisch"
        | "vegan"
        | "duurzaam"
        | "inclusief"
        | "internationaal"
        | "huisdieren"
      location_tag_enum:
        | "dichtbij_universiteit"
        | "dichtbij_station"
        | "dichtbij_ov"
        | "dichtbij_centrum"
        | "dichtbij_supermarkt"
        | "dichtbij_uitgaan"
        | "dichtbij_sportcentrum"
        | "dichtbij_park"
        | "rustige_buurt"
        | "levendige_buurt"
      message_type_enum: "text" | "image" | "system"
      rental_type_enum: "vast" | "onderhuur" | "tijdelijk"
      report_reason_enum:
        | "spam"
        | "harassment"
        | "fake_profile"
        | "inappropriate_content"
        | "scam"
        | "discrimination"
        | "other"
      report_status_enum: "pending" | "reviewing" | "resolved" | "dismissed"
      review_decision_enum: "like" | "maybe" | "reject"
      room_feature_enum:
        | "eigen_badkamer"
        | "gedeelde_badkamer"
        | "eigen_keuken"
        | "gedeelde_keuken"
        | "balkon"
        | "tuin"
        | "terras"
        | "berging"
        | "parkeerplaats"
        | "fietsenstalling"
        | "wasmachine"
        | "droger"
        | "vaatwasser"
        | "wifi_inbegrepen"
        | "huisdieren_toegestaan"
        | "roken_toegestaan"
        | "geen_huisdieren"
        | "niet_roken"
      room_status_enum: "draft" | "active" | "paused" | "closed"
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
    Enums: {
      admin_action_enum: [
        "view_report",
        "suspend_user",
        "unsuspend_user",
        "remove_listing",
        "remove_message",
        "dismiss_report",
      ],
      affiliation_enum: ["student", "employee", "staff"],
      application_status_enum: [
        "sent",
        "seen",
        "liked",
        "maybe",
        "rejected",
        "invited",
        "attending",
        "not_attending",
        "accepted",
        "not_chosen",
        "withdrawn",
      ],
      city_enum: [
        "amsterdam",
        "rotterdam",
        "den_haag",
        "utrecht",
        "groningen",
        "eindhoven",
        "tilburg",
        "nijmegen",
        "enschede",
        "arnhem",
        "leiden",
        "maastricht",
        "delft",
        "breda",
        "leeuwarden",
        "zwolle",
        "den_bosch",
        "haarlem",
        "wageningen",
        "middelburg",
        "vlissingen",
        "deventer",
        "apeldoorn",
        "amersfoort",
        "almere",
        "dordrecht",
        "heerlen",
        "sittard",
        "venlo",
        "helmond",
        "anders",
      ],
      conversation_type_enum: ["direct", "group", "house"],
      delivery_status_enum: ["sent", "delivered", "read"],
      furnishing_enum: ["kaal", "gestoffeerd", "gemeubileerd"],
      gender_enum: ["man", "vrouw", "zeg_ik_liever_niet"],
      gender_preference_enum: ["man", "vrouw", "geen_voorkeur"],
      house_type_enum: [
        "studentenhuis",
        "appartement",
        "studio",
        "woongroep",
        "anti_kraak",
      ],
      housemate_role_enum: ["owner", "admin", "member"],
      invitation_status_enum: [
        "pending",
        "attending",
        "not_attending",
        "maybe",
      ],
      language_enum: [
        "nl",
        "en",
        "de",
        "fr",
        "es",
        "it",
        "pt",
        "zh",
        "ar",
        "tr",
        "pl",
        "hi",
        "ja",
        "ko",
      ],
      lifestyle_tag_enum: [
        "gezellig",
        "rustig",
        "introvert",
        "extravert",
        "sporten",
        "koken",
        "gamen",
        "muziek",
        "uitgaan",
        "feesten",
        "studeren",
        "lezen",
        "reizen",
        "filmavond",
        "creatief",
        "vroege_vogel",
        "nachtbraker",
        "schoon",
        "relaxed_met_schoonmaken",
        "vegetarisch",
        "vegan",
        "duurzaam",
        "inclusief",
        "internationaal",
        "huisdieren",
      ],
      location_tag_enum: [
        "dichtbij_universiteit",
        "dichtbij_station",
        "dichtbij_ov",
        "dichtbij_centrum",
        "dichtbij_supermarkt",
        "dichtbij_uitgaan",
        "dichtbij_sportcentrum",
        "dichtbij_park",
        "rustige_buurt",
        "levendige_buurt",
      ],
      message_type_enum: ["text", "image", "system"],
      rental_type_enum: ["vast", "onderhuur", "tijdelijk"],
      report_reason_enum: [
        "spam",
        "harassment",
        "fake_profile",
        "inappropriate_content",
        "scam",
        "discrimination",
        "other",
      ],
      report_status_enum: ["pending", "reviewing", "resolved", "dismissed"],
      review_decision_enum: ["like", "maybe", "reject"],
      room_feature_enum: [
        "eigen_badkamer",
        "gedeelde_badkamer",
        "eigen_keuken",
        "gedeelde_keuken",
        "balkon",
        "tuin",
        "terras",
        "berging",
        "parkeerplaats",
        "fietsenstalling",
        "wasmachine",
        "droger",
        "vaatwasser",
        "wifi_inbegrepen",
        "huisdieren_toegestaan",
        "roken_toegestaan",
        "geen_huisdieren",
        "niet_roken",
      ],
      room_status_enum: ["draft", "active", "paused", "closed"],
    },
  },
} as const


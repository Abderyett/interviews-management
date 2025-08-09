import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          student_id: string
          name: string
          interview_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          interview_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          interview_date?: string
          created_at?: string
        }
      }
      interview_queue: {
        Row: {
          id: string
          student_id: string
          name: string
          queue_number: number
          arrival_time: string
          status: string
          assigned_room: string | null
          interview_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          queue_number: number
          arrival_time: string
          status: string
          assigned_room?: string | null
          interview_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          queue_number?: number
          arrival_time?: string
          status?: string
          assigned_room?: string | null
          interview_date?: string
          created_at?: string
        }
      }
      completed_interviews: {
        Row: {
          id: string
          student_id: string
          name: string
          queue_number: number
          completed_time: string
          interview_duration: number
          professor_name: string
          room: string
          interview_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          queue_number: number
          completed_time: string
          interview_duration: number
          professor_name: string
          room: string
          interview_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          queue_number?: number
          completed_time?: string
          interview_duration?: number
          professor_name?: string
          room?: string
          interview_date?: string
          created_at?: string
        }
      }
      professor_status: {
        Row: {
          id: string
          professor_id: number
          name: string
          room: string
          floor: string
          status: string
          current_student_id: string | null
          current_student_name: string | null
          interview_start_time: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          professor_id: number
          name: string
          room: string
          floor: string
          status: string
          current_student_id?: string | null
          current_student_name?: string | null
          interview_start_time?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          professor_id?: number
          name?: string
          room?: string
          floor?: string
          status?: string
          current_student_id?: string | null
          current_student_name?: string | null
          interview_start_time?: string | null
          date?: string
          created_at?: string
        }
      }
    }
  }
}
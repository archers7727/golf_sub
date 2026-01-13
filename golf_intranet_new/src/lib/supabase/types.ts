export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          type: 'manager' | 'admin'
          phone_number: string
          name: string
          charge_rate: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          type?: 'manager' | 'admin'
          phone_number: string
          name: string
          charge_rate?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          type?: 'manager' | 'admin'
          phone_number?: string
          name?: string
          charge_rate?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      golf_clubs: {
        Row: {
          id: string
          region: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          name: string
          cancel_deadline_date: number
          cancel_deadline_hour: number
          reservable_count_type: 'TOTAL' | 'DAYEND'
          reservable_count_1: number
          reservable_count_2: number
          hidden: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          region: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          name: string
          cancel_deadline_date?: number
          cancel_deadline_hour?: number
          reservable_count_type?: 'TOTAL' | 'DAYEND'
          reservable_count_1?: number
          reservable_count_2?: number
          hidden?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          region?: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          name?: string
          cancel_deadline_date?: number
          cancel_deadline_hour?: number
          reservable_count_type?: 'TOTAL' | 'DAYEND'
          reservable_count_1?: number
          reservable_count_2?: number
          hidden?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          club_id: string | null
          region: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          golf_club_name: string
          course_name: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          club_id?: string | null
          region: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          golf_club_name: string
          course_name: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          club_id?: string | null
          region?: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
          golf_club_name?: string
          course_name?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      site_ids: {
        Row: {
          id: string
          site_id: string
          name: string
          golf_club_id: string | null
          disabled: boolean
          hidden: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          site_id: string
          name: string
          golf_club_id?: string | null
          disabled?: boolean
          hidden?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          golf_club_id?: string | null
          disabled?: boolean
          hidden?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      course_times: {
        Row: {
          id: string
          author_id: string | null
          course_id: string | null
          site_id: string | null
          reserved_time: string
          reserved_name: string
          green_fee: number
          charge_fee: number
          requirements: '조건없음' | '인회필' | '예변필' | '인회필/예변필'
          flag: number
          memo: string | null
          status: '판매완료' | '미판매' | '타업체마감'
          block_until: string | null
          blocker_id: string | null
          join_num: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id?: string | null
          course_id?: string | null
          site_id?: string | null
          reserved_time: string
          reserved_name: string
          green_fee?: number
          charge_fee?: number
          requirements?: '조건없음' | '인회필' | '예변필' | '인회필/예변필'
          flag?: number
          memo?: string | null
          status?: '판매완료' | '미판매' | '타업체마감'
          block_until?: string | null
          blocker_id?: string | null
          join_num?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string | null
          course_id?: string | null
          site_id?: string | null
          reserved_time?: string
          reserved_name?: string
          green_fee?: number
          charge_fee?: number
          requirements?: '조건없음' | '인회필' | '예변필' | '인회필/예변필'
          flag?: number
          memo?: string | null
          status?: '판매완료' | '미판매' | '타업체마감'
          block_until?: string | null
          blocker_id?: string | null
          join_num?: number
          created_at?: string
          updated_at?: string
        }
      }
      join_persons: {
        Row: {
          id: string
          manager_id: string | null
          time_id: string | null
          name: string
          join_type: '양도' | '남여' | '남' | '여' | '남남' | '여여' | '남남남' | '여여여'
          join_num: number
          phone_number: string
          green_fee: number
          charge_fee: number
          charge_rate: number
          status: '입금확인전' | '입금확인중' | '입금완료' | '환불확인중' | '환불완료'
          refund_reason: string | null
          refund_account: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manager_id?: string | null
          time_id?: string | null
          name: string
          join_type: '양도' | '남여' | '남' | '여' | '남남' | '여여' | '남남남' | '여여여'
          join_num: number
          phone_number: string
          green_fee?: number
          charge_fee?: number
          charge_rate?: number
          status?: '입금확인전' | '입금확인중' | '입금완료' | '환불확인중' | '환불완료'
          refund_reason?: string | null
          refund_account?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manager_id?: string | null
          time_id?: string | null
          name?: string
          join_type?: '양도' | '남여' | '남' | '여' | '남남' | '여여' | '남남남' | '여여여'
          join_num?: number
          phone_number?: string
          green_fee?: number
          charge_fee?: number
          charge_rate?: number
          status?: '입금확인전' | '입금확인중' | '입금완료' | '환불확인중' | '환불완료'
          refund_reason?: string | null
          refund_account?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      black_lists: {
        Row: {
          id: string
          author_id: string | null
          name: string
          phone_number: string
          reason: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id?: string | null
          name: string
          phone_number: string
          reason: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string | null
          name?: string
          phone_number?: string
          reason?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      holidays: {
        Row: {
          id: string
          date: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'manager' | 'admin'
      course_time_status: '판매완료' | '미판매' | '타업체마감'
      join_person_status: '입금확인전' | '입금확인중' | '입금완료' | '환불확인중' | '환불완료'
      golf_region: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
      reservable_count_type: 'TOTAL' | 'DAYEND'
      requirements_type: '조건없음' | '인회필' | '예변필' | '인회필/예변필'
    }
  }
}

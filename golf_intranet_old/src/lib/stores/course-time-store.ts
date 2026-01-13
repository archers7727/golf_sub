// @ts-nocheck
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type CourseTime = Database['public']['Tables']['course_times']['Row']
type CourseTimeInsert = Database['public']['Tables']['course_times']['Insert']
type CourseTimeUpdate = Database['public']['Tables']['course_times']['Update']

interface CourseTimeWithRelations extends CourseTime {
  courses?: {
    id: string
    golf_club_name: string
    course_name: string
  } | null
  site_ids?: {
    id: string
    site_id: string
    name: string
  } | null
  users?: {
    id: string
    name: string
  } | null
}

interface CourseTimeFilters {
  startDate?: string
  endDate?: string
  status?: string
  region?: string
}

interface CourseTimeState {
  courseTimes: CourseTimeWithRelations[]
  loading: boolean
  error: string | null
  fetchCourseTimes: (filters?: CourseTimeFilters) => Promise<void>
  createCourseTime: (data: CourseTimeInsert) => Promise<void>
  updateCourseTime: (id: string, data: CourseTimeUpdate) => Promise<void>
  deleteCourseTime: (id: string) => Promise<void>
}

export const useCourseTimeStore = create<CourseTimeState>((set, get) => ({
  courseTimes: [],
  loading: false,
  error: null,

  fetchCourseTimes: async (filters = {}) => {
    set({ loading: true, error: null })
    const supabase = createClient()

    try {
      let query = supabase
        .from('course_times')
        .select(`
          *,
          courses (
            id,
            golf_club_name,
            course_name
          ),
          site_ids (
            id,
            site_id,
            name
          ),
          users:author_id (
            id,
            name
          )
        `)
        .order('reserved_time', { ascending: true })

      // 필터 적용
      if (filters.startDate) {
        query = query.gte('reserved_time', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('reserved_time', filters.endDate)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error

      set({ courseTimes: (data || []) as CourseTimeWithRelations[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createCourseTime: async (data) => {
    const supabase = createClient()
    const { error } = await supabase.from('course_times').insert(data)

    if (error) throw error

    // 목록 새로고침
    await get().fetchCourseTimes()
  },

  updateCourseTime: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('course_times').update(data).eq('id', id)

    if (error) throw error

    await get().fetchCourseTimes()
  },

  deleteCourseTime: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('course_times').delete().eq('id', id)

    if (error) throw error

    await get().fetchCourseTimes()
  },
}))

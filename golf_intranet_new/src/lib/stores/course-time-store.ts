import { create } from 'zustand'
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
  search?: string
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

    try {
      // Build query params
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      if (filters.region) params.append('region', filters.region)

      const url = `/api/course-times${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch course times')
      }

      const data = await response.json()
      set({ courseTimes: data as CourseTimeWithRelations[], loading: false })
    } catch (error: any) {
      console.error('Error fetching course times:', error)
      set({ error: error.message, loading: false })
    }
  },

  createCourseTime: async (data) => {
    const response = await fetch('/api/course-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create course time')
    }

    // 목록 새로고침
    await get().fetchCourseTimes()
  },

  updateCourseTime: async (id, data) => {
    const response = await fetch('/api/course-times', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update course time')
    }

    await get().fetchCourseTimes()
  },

  deleteCourseTime: async (id) => {
    const response = await fetch('/api/course-times', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete course time')
    }

    await get().fetchCourseTimes()
  },
}))

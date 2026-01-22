import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/lib/types/database.types'

type CourseTime = Database['public']['Tables']['course_times']['Row']
type CourseTimeInsert = Database['public']['Tables']['course_times']['Insert']
type CourseTimeUpdate = Database['public']['Tables']['course_times']['Update']

export interface CourseTimeWithRelations extends CourseTime {
  courses?: {
    id: string
    golf_club_name: string
    course_name: string
    region?: string
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

export interface CourseTimeFilters {
  startDate?: string
  endDate?: string
  status?: string
  region?: string
  search?: string
}

// Query keys
export const courseTimeKeys = {
  all: ['courseTimes'] as const,
  lists: () => [...courseTimeKeys.all, 'list'] as const,
  list: (filters: CourseTimeFilters) => [...courseTimeKeys.lists(), filters] as const,
  details: () => [...courseTimeKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseTimeKeys.details(), id] as const,
}

// Fetch functions
async function fetchCourseTimes(filters: CourseTimeFilters = {}): Promise<CourseTimeWithRelations[]> {
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

  return response.json()
}

async function fetchCourseTime(id: string): Promise<CourseTimeWithRelations> {
  const response = await fetch(`/api/course-times?id=${id}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch course time')
  }

  return response.json()
}

async function createCourseTime(data: CourseTimeInsert): Promise<CourseTime> {
  const response = await fetch('/api/course-times', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create course time')
  }

  return response.json()
}

async function updateCourseTime({ id, data }: { id: string; data: CourseTimeUpdate }): Promise<CourseTime> {
  const response = await fetch('/api/course-times', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update course time')
  }

  return response.json()
}

async function deleteCourseTime(id: string): Promise<void> {
  const response = await fetch('/api/course-times', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete course time')
  }
}

// Hooks
export function useCourseTimesQuery(filters: CourseTimeFilters = {}) {
  return useQuery({
    queryKey: courseTimeKeys.list(filters),
    queryFn: () => fetchCourseTimes(filters),
  })
}

export function useCourseTimeQuery(id: string | undefined) {
  return useQuery({
    queryKey: courseTimeKeys.detail(id || ''),
    queryFn: () => fetchCourseTime(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  })
}

export function useCreateCourseTimeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCourseTime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseTimeKeys.lists() })
    },
  })
}

export function useUpdateCourseTimeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCourseTime,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseTimeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseTimeKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCourseTimeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCourseTime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseTimeKeys.lists() })
    },
  })
}

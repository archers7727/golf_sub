import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/lib/types/database.types'
import { courseTimeKeys } from './useCourseTimesQuery'

type JoinPerson = Database['public']['Tables']['join_persons']['Row']
type JoinPersonInsert = Database['public']['Tables']['join_persons']['Insert']
type JoinPersonUpdate = Database['public']['Tables']['join_persons']['Update']

export interface JoinPersonWithRelations extends JoinPerson {
  users?: {
    id: string
    name: string
  } | null
}

// Query keys
export const joinPersonKeys = {
  all: ['joinPersons'] as const,
  lists: () => [...joinPersonKeys.all, 'list'] as const,
  list: (timeId?: string) => [...joinPersonKeys.lists(), { timeId }] as const,
}

// Fetch functions
async function fetchJoinPersons(timeId?: string): Promise<JoinPersonWithRelations[]> {
  const params = new URLSearchParams()
  if (timeId) params.append('timeId', timeId)

  const url = `/api/join-persons${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch join persons')
  }

  return response.json()
}

async function createJoinPerson(data: JoinPersonInsert): Promise<JoinPerson> {
  const response = await fetch('/api/join-persons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create join person')
  }

  return response.json()
}

async function updateJoinPerson({ id, data }: { id: string; data: JoinPersonUpdate }): Promise<JoinPerson> {
  const response = await fetch('/api/join-persons', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update join person')
  }

  return response.json()
}

async function deleteJoinPerson(id: string): Promise<void> {
  const response = await fetch('/api/join-persons', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete join person')
  }
}

// Hooks
export function useJoinPersonsQuery(timeId?: string) {
  return useQuery({
    queryKey: joinPersonKeys.list(timeId),
    queryFn: () => fetchJoinPersons(timeId),
    enabled: !!timeId,
  })
}

export function useCreateJoinPersonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createJoinPerson,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: joinPersonKeys.list(variables.time_id || undefined) })
      // 조인인원 변경시 course time의 join_num도 업데이트되므로 해당 캐시도 무효화
      if (variables.time_id) {
        queryClient.invalidateQueries({ queryKey: courseTimeKeys.detail(variables.time_id) })
        queryClient.invalidateQueries({ queryKey: courseTimeKeys.lists() })
      }
    },
  })
}

export function useUpdateJoinPersonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateJoinPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: joinPersonKeys.lists() })
    },
  })
}

export function useDeleteJoinPersonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteJoinPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: joinPersonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseTimeKeys.lists() })
    },
  })
}

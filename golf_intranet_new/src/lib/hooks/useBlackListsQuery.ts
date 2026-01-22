import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/lib/types/database.types'

type BlackList = Database['public']['Tables']['black_lists']['Row']
type BlackListInsert = Database['public']['Tables']['black_lists']['Insert']

export interface BlackListWithAuthor extends BlackList {
  users?: {
    id: string
    name: string
  } | null
}

// Query keys
export const blackListKeys = {
  all: ['blackLists'] as const,
  lists: () => [...blackListKeys.all, 'list'] as const,
  list: (searchTerm?: string) => [...blackListKeys.lists(), { searchTerm }] as const,
}

// Fetch functions
async function fetchBlackLists(): Promise<BlackListWithAuthor[]> {
  const response = await fetch('/api/black-lists')

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch black lists')
  }

  return response.json()
}

async function createBlackList(data: BlackListInsert): Promise<BlackList> {
  const response = await fetch('/api/black-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create black list')
  }

  return response.json()
}

async function deleteBlackList(id: string): Promise<void> {
  const response = await fetch('/api/black-lists', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete black list')
  }
}

// Hooks
export function useBlackListsQuery(searchTerm?: string) {
  return useQuery({
    queryKey: blackListKeys.list(searchTerm),
    queryFn: fetchBlackLists,
    select: (data) => {
      // Client-side search filtering
      if (!searchTerm) return data
      const lowerSearch = searchTerm.toLowerCase()
      return data.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.phone_number.toLowerCase().includes(lowerSearch)
      )
    },
  })
}

export function useCreateBlackListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBlackList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blackListKeys.lists() })
    },
  })
}

export function useDeleteBlackListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBlackList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blackListKeys.lists() })
    },
  })
}

import { create } from 'zustand'
import type { Database } from '@/lib/types/database.types'

type BlackList = Database['public']['Tables']['black_lists']['Row']
type BlackListInsert = Database['public']['Tables']['black_lists']['Insert']

interface BlackListWithAuthor extends BlackList {
  users?: {
    id: string
    name: string
  } | null
}

interface BlackListState {
  blackLists: BlackListWithAuthor[]
  loading: boolean
  error: string | null
  fetchBlackLists: (searchTerm?: string) => Promise<void>
  createBlackList: (data: BlackListInsert) => Promise<void>
  deleteBlackList: (id: string) => Promise<void>
}

export const useBlackListStore = create<BlackListState>((set, get) => ({
  blackLists: [],
  loading: false,
  error: null,

  fetchBlackLists: async (searchTerm = '') => {
    set({ loading: true, error: null })

    try {
      const response = await fetch('/api/black-lists')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch black lists')
      }

      let data = await response.json()

      // Client-side search filtering (API doesn't support search yet)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        data = data.filter(
          (item: BlackListWithAuthor) =>
            item.name.toLowerCase().includes(lowerSearch) ||
            item.phone_number.toLowerCase().includes(lowerSearch)
        )
      }

      set({ blackLists: data as BlackListWithAuthor[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createBlackList: async (data) => {
    const response = await fetch('/api/black-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create black list')
    }

    // 목록 새로고침
    await get().fetchBlackLists()
  },

  deleteBlackList: async (id) => {
    const response = await fetch('/api/black-lists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete black list')
    }

    await get().fetchBlackLists()
  },
}))

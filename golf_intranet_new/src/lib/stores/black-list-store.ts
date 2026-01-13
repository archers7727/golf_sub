import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
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
    const supabase = createClient()

    try {
      let query = supabase
        .from('black_lists')
        .select(
          `
          *,
          users:author_id (
            id,
            name
          )
        `
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // 검색어가 있으면 이름 또는 전화번호로 검색
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      set({ blackLists: (data || []) as BlackListWithAuthor[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createBlackList: async (data) => {
    const supabase = createClient()
    const { error } = await supabase.from('black_lists').insert(data)

    if (error) throw error

    // 목록 새로고침
    await get().fetchBlackLists()
  },

  deleteBlackList: async (id) => {
    const supabase = createClient()

    // Soft delete (deleted_at 설정)
    const { error } = await supabase
      .from('black_lists')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    await get().fetchBlackLists()
  },
}))

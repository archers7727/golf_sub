import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type JoinPerson = Database['public']['Tables']['join_persons']['Row']
type JoinPersonInsert = Database['public']['Tables']['join_persons']['Insert']
type JoinPersonUpdate = Database['public']['Tables']['join_persons']['Update']

interface JoinPersonWithRelations extends JoinPerson {
  users?: {
    id: string
    name: string
  } | null
}

interface JoinPersonState {
  joinPersons: JoinPersonWithRelations[]
  loading: boolean
  error: string | null
  fetchJoinPersons: (timeId?: string) => Promise<void>
  createJoinPerson: (data: JoinPersonInsert) => Promise<void>
  updateJoinPerson: (id: string, data: JoinPersonUpdate) => Promise<void>
  deleteJoinPerson: (id: string) => Promise<void>
}

export const useJoinPersonStore = create<JoinPersonState>((set, get) => ({
  joinPersons: [],
  loading: false,
  error: null,

  fetchJoinPersons: async (timeId) => {
    set({ loading: true, error: null })
    const supabase = createClient()

    try {
      let query = supabase
        .from('join_persons')
        .select(`
          *,
          users:manager_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (timeId) {
        query = query.eq('time_id', timeId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ joinPersons: (data || []) as JoinPersonWithRelations[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createJoinPerson: async (data) => {
    const supabase = createClient()
    const { error } = await supabase.from('join_persons').insert(data)

    if (error) throw error

    // 목록 새로고침
    if (data.time_id) {
      await get().fetchJoinPersons(data.time_id)
    }
  },

  updateJoinPerson: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('join_persons').update(data).eq('id', id)

    if (error) throw error

    // 현재 조인 목록에서 time_id 찾기
    const currentJoin = get().joinPersons.find((j) => j.id === id)
    if (currentJoin?.time_id) {
      await get().fetchJoinPersons(currentJoin.time_id)
    }
  },

  deleteJoinPerson: async (id) => {
    const supabase = createClient()

    // 삭제 전 time_id 저장
    const currentJoin = get().joinPersons.find((j) => j.id === id)

    const { error } = await supabase.from('join_persons').delete().eq('id', id)

    if (error) throw error

    // 목록 새로고침
    if (currentJoin?.time_id) {
      await get().fetchJoinPersons(currentJoin.time_id)
    }
  },
}))

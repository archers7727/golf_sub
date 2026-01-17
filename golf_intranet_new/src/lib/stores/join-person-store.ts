import { create } from 'zustand'
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

    try {
      const params = new URLSearchParams()
      if (timeId) params.append('timeId', timeId)

      const url = `/api/join-persons${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch join persons')
      }

      const data = await response.json()
      set({ joinPersons: data as JoinPersonWithRelations[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createJoinPerson: async (data) => {
    const response = await fetch('/api/join-persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create join person')
    }

    // 목록 새로고침
    if (data.time_id) {
      await get().fetchJoinPersons(data.time_id)
    }
  },

  updateJoinPerson: async (id, data) => {
    const response = await fetch('/api/join-persons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update join person')
    }

    // 현재 조인 목록에서 time_id 찾기
    const currentJoin = get().joinPersons.find((j) => j.id === id)
    if (currentJoin?.time_id) {
      await get().fetchJoinPersons(currentJoin.time_id)
    }
  },

  deleteJoinPerson: async (id) => {
    // 삭제 전 time_id 저장
    const currentJoin = get().joinPersons.find((j) => j.id === id)

    const response = await fetch('/api/join-persons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete join person')
    }

    // 목록 새로고침
    if (currentJoin?.time_id) {
      await get().fetchJoinPersons(currentJoin.time_id)
    }
  },
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'

type CourseFormData = {
  region: string
  golf_club_name: string
  course_name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(req, res)

    // 사용자 인증 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('[API] Session error:', sessionError)
      return res.status(401).json({ error: '인증이 필요합니다' })
    }

    console.log('[API] Session user:', session.user.id)

    // 사용자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('type')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      console.error('[API] User query failed:', userError)
      return res.status(401).json({ error: '사용자 정보를 확인할 수 없습니다' })
    }

    // 타입 단언으로 TypeScript 에러 해결
    const user = userData as { type: 'admin' | 'manager' }

    if (user.type !== 'admin') {
      console.error('[API] User is not admin:', user)
      return res.status(403).json({ error: '관리자 권한이 필요합니다' })
    }

    console.log('[API] User is admin')

    const formData = req.body as CourseFormData

    if (!formData.golf_club_name?.trim() || !formData.course_name?.trim()) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요' })
    }

    console.log('[API] Creating course:', formData)

    // 1. 골프장 존재 확인
    const { data: existingClub, error: clubCheckError } = await supabase
      .from('golf_clubs')
      .select('id')
      .eq('name', formData.golf_club_name.trim())
      .eq('region', formData.region)
      .is('deleted_at', null)
      .maybeSingle()

    if (clubCheckError) {
      console.error('[API] Club check error:', clubCheckError)
      return res.status(500).json({ error: '골프장 확인 중 오류가 발생했습니다', details: clubCheckError.message })
    }

    let clubId = existingClub?.id

    // 2. 골프장이 없으면 생성
    if (!clubId) {
      console.log('[API] Creating new golf club...')
      const { data: newClub, error: clubError } = await supabase
        .from('golf_clubs')
        .insert({
          region: formData.region,
          name: formData.golf_club_name.trim(),
          cancel_deadline_date: 1,
          cancel_deadline_hour: 18,
        })
        .select('id')
        .single()

      if (clubError || !newClub) {
        console.error('[API] Club creation error:', clubError)
        return res.status(500).json({ error: '골프장 생성 중 오류가 발생했습니다', details: clubError?.message })
      }

      clubId = newClub.id
      console.log('[API] New club created:', clubId)
    }

    // 3. 중복 체크
    const { data: duplicateCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('golf_club_name', formData.golf_club_name.trim())
      .eq('course_name', formData.course_name.trim())
      .eq('region', formData.region)
      .is('deleted_at', null)
      .maybeSingle()

    if (duplicateCourse) {
      console.log('[API] Duplicate course found')
      return res.status(409).json({ error: '이미 존재하는 골프장 코스입니다' })
    }

    // 4. 코스 추가
    console.log('[API] Inserting course...')
    const { error: courseError } = await supabase.from('courses').insert({
      club_id: clubId,
      region: formData.region,
      golf_club_name: formData.golf_club_name.trim(),
      course_name: formData.course_name.trim(),
    })

    if (courseError) {
      console.error('[API] Course insertion error:', courseError)
      return res.status(500).json({ error: '코스 추가 중 오류가 발생했습니다', details: courseError.message })
    }

    console.log('[API] Course created successfully')
    return res.status(200).json({ success: true, message: '골프장이 추가되었습니다' })

  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return res.status(500).json({ error: '서버 오류가 발생했습니다', details: error.message })
  }
}

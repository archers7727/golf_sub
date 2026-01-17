import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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
    // 일반 클라이언트로 세션 확인
    const supabaseAuth = createClient(req, res)
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()

    if (sessionError || !session) {
      console.error('[API] Session error:', sessionError)
      return res.status(401).json({ error: '인증이 필요합니다' })
    }

    console.log('[API] Session user:', session.user.id)

    // Prisma로 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { type: true },
    })

    if (!user) {
      console.error('[API] User not found')
      return res.status(401).json({ error: '사용자 정보를 확인할 수 없습니다' })
    }

    if (user.type !== 'ADMIN') {
      console.error('[API] User is not admin:', user)
      return res.status(403).json({ error: '관리자 권한이 필요합니다' })
    }

    console.log('[API] User is admin')

    const formData = req.body as CourseFormData

    if (!formData.golf_club_name?.trim() || !formData.course_name?.trim()) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요' })
    }

    console.log('[API] Creating course:', formData)

    // Map region string to GolfRegion enum
    const regionMap: Record<string, string> = {
      '경기북부': 'GYEONGGI_NORTH',
      '경기남부': 'GYEONGGI_SOUTH',
      '충청도': 'CHUNGCHEONG',
      '경상남도': 'GYEONGSANG',
      '강원도': 'GANGWON',
    }

    const regionEnum = regionMap[formData.region] || formData.region

    // 1. 골프장 존재 확인
    const existingClub = await prisma.golfClub.findFirst({
      where: {
        name: formData.golf_club_name.trim(),
        region: regionEnum as any,
        deletedAt: null,
      },
      select: { id: true },
    })

    let clubId = existingClub?.id

    // 2. 골프장이 없으면 생성
    if (!clubId) {
      console.log('[API] Creating new golf club...')
      const newClub = await prisma.golfClub.create({
        data: {
          region: regionEnum as any,
          name: formData.golf_club_name.trim(),
          cancelDeadlineDate: 1,
          cancelDeadlineHour: 18,
        },
        select: { id: true },
      })

      clubId = newClub.id
      console.log('[API] New club created:', clubId)
    }

    // 3. 중복 체크
    const duplicateCourse = await prisma.course.findFirst({
      where: {
        golfClubName: formData.golf_club_name.trim(),
        courseName: formData.course_name.trim(),
        region: regionEnum as any,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (duplicateCourse) {
      console.log('[API] Duplicate course found')
      return res.status(409).json({ error: '이미 존재하는 골프장 코스입니다' })
    }

    // 4. 코스 추가
    console.log('[API] Inserting course...')
    await prisma.course.create({
      data: {
        clubId: clubId,
        region: regionEnum as any,
        golfClubName: formData.golf_club_name.trim(),
        courseName: formData.course_name.trim(),
      },
    })

    console.log('[API] Course created successfully')
    return res.status(200).json({ success: true, message: '골프장이 추가되었습니다' })

  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return res.status(500).json({ error: '서버 오류가 발생했습니다', details: error.message })
  }
}

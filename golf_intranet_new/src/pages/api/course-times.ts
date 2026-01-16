/**
 * API Route: /api/course-times
 * Handles CRUD operations for course times
 * Using Prisma ORM for type-safe database access
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/course-times
 * Query params: startDate, endDate, status, region, id
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate, status, region, id } = req.query

  try {
    // Get single course time by ID
    if (id && typeof id === 'string') {
      const courseTime = await prisma.courseTime.findUnique({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              golfClubName: true,
              courseName: true,
              region: true,
            },
          },
          siteIdRel: {
            select: {
              id: true,
              siteId: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!courseTime) {
        return res.status(404).json({ error: 'Course time not found' })
      }

      // Transform to match frontend expectations (snake_case)
      const transformed = {
        ...courseTime,
        author_id: courseTime.authorId,
        course_id: courseTime.courseId,
        site_id: courseTime.siteId,
        reserved_time: courseTime.reservedTime,
        reserved_name: courseTime.reservedName,
        green_fee: courseTime.greenFee,
        charge_fee: courseTime.chargeFee,
        block_until: courseTime.blockUntil,
        blocker_id: courseTime.blockerId,
        join_num: courseTime.joinNum,
        created_at: courseTime.createdAt,
        updated_at: courseTime.updatedAt,
        courses: courseTime.course ? {
          id: courseTime.course.id,
          golf_club_name: courseTime.course.golfClubName,
          course_name: courseTime.course.courseName,
          region: courseTime.course.region,
        } : null,
        site_ids: courseTime.siteIdRel ? {
          id: courseTime.siteIdRel.id,
          site_id: courseTime.siteIdRel.siteId,
          name: courseTime.siteIdRel.name,
        } : null,
        users: courseTime.author,
      }

      return res.status(200).json(transformed)
    }

    // Build where clause for list query
    const where: any = {}

    if (startDate && typeof startDate === 'string') {
      where.reservedTime = { ...where.reservedTime, gte: new Date(startDate) }
    }
    if (endDate && typeof endDate === 'string') {
      where.reservedTime = { ...where.reservedTime, lte: new Date(endDate) }
    }
    if (status && typeof status === 'string') {
      where.status = status
    }
    // Note: region filter would require joining course table

    // Get list with filters
    const courseTimes = await prisma.courseTime.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            golfClubName: true,
            courseName: true,
            region: true,
          },
        },
        siteIdRel: {
          select: {
            id: true,
            siteId: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        reservedTime: 'desc',
      },
    })

    // Transform to match frontend expectations (snake_case)
    const transformed = courseTimes.map((ct) => ({
      ...ct,
      author_id: ct.authorId,
      course_id: ct.courseId,
      site_id: ct.siteId,
      reserved_time: ct.reservedTime,
      reserved_name: ct.reservedName,
      green_fee: ct.greenFee,
      charge_fee: ct.chargeFee,
      block_until: ct.blockUntil,
      blocker_id: ct.blockerId,
      join_num: ct.joinNum,
      created_at: ct.createdAt,
      updated_at: ct.updatedAt,
      courses: ct.course ? {
        id: ct.course.id,
        golf_club_name: ct.course.golfClubName,
        course_name: ct.course.courseName,
        region: ct.course.region,
      } : null,
      site_ids: ct.siteIdRel ? {
        id: ct.siteIdRel.id,
        site_id: ct.siteIdRel.siteId,
        name: ct.siteIdRel.name,
      } : null,
      users: ct.author,
    }))

    return res.status(200).json(transformed)
  } catch (error) {
    console.error('Error fetching course times:', error)
    return res.status(500).json({ error: 'Failed to fetch course times' })
  }
}

/**
 * POST /api/course-times
 * Create new course time
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body

    // Convert snake_case to camelCase for Prisma
    const prismaData: any = {
      authorId: data.author_id,
      courseId: data.course_id,
      siteId: data.site_id,
      reservedTime: new Date(data.reserved_time),
      reservedName: data.reserved_name,
      greenFee: data.green_fee ?? 0,
      chargeFee: data.charge_fee ?? 0,
      requirements: data.requirements ?? '조건없음',
      flag: data.flag ?? 0,
      memo: data.memo,
      status: data.status ?? '미판매',
      blockUntil: data.block_until ? new Date(data.block_until) : null,
      blockerId: data.blocker_id,
      joinNum: data.join_num ?? 0,
    }

    const courseTime = await prisma.courseTime.create({
      data: prismaData,
    })

    return res.status(201).json(courseTime)
  } catch (error) {
    console.error('Error creating course time:', error)
    return res.status(400).json({ error: 'Failed to create course time' })
  }
}

/**
 * PUT /api/course-times
 * Update existing course time
 * Body: { id, ...updateData }
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, ...updateData } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    // Convert snake_case to camelCase for Prisma
    const prismaData: any = {}
    if (updateData.author_id !== undefined) prismaData.authorId = updateData.author_id
    if (updateData.course_id !== undefined) prismaData.courseId = updateData.course_id
    if (updateData.site_id !== undefined) prismaData.siteId = updateData.site_id
    if (updateData.reserved_time !== undefined) prismaData.reservedTime = new Date(updateData.reserved_time)
    if (updateData.reserved_name !== undefined) prismaData.reservedName = updateData.reserved_name
    if (updateData.green_fee !== undefined) prismaData.greenFee = updateData.green_fee
    if (updateData.charge_fee !== undefined) prismaData.chargeFee = updateData.charge_fee
    if (updateData.requirements !== undefined) prismaData.requirements = updateData.requirements
    if (updateData.flag !== undefined) prismaData.flag = updateData.flag
    if (updateData.memo !== undefined) prismaData.memo = updateData.memo
    if (updateData.status !== undefined) prismaData.status = updateData.status
    if (updateData.block_until !== undefined) prismaData.blockUntil = updateData.block_until ? new Date(updateData.block_until) : null
    if (updateData.blocker_id !== undefined) prismaData.blockerId = updateData.blocker_id
    if (updateData.join_num !== undefined) prismaData.joinNum = updateData.join_num

    const courseTime = await prisma.courseTime.update({
      where: { id },
      data: prismaData,
    })

    return res.status(200).json(courseTime)
  } catch (error) {
    console.error('Error updating course time:', error)
    return res.status(400).json({ error: 'Failed to update course time' })
  }
}

/**
 * DELETE /api/course-times
 * Delete course time
 * Body: { id }
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    await prisma.courseTime.delete({
      where: { id },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error deleting course time:', error)
    return res.status(400).json({ error: 'Failed to delete course time' })
  }
}

/**
 * API Route: /api/course-times
 * Handles CRUD operations for course times
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  // Get single course time by ID
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('course_times')
      .select(
        `
        *,
        courses:course_id (
          id,
          golf_club_name,
          course_name,
          region
        ),
        site_ids:site_id (
          id,
          site_id,
          name
        ),
        users:author_id (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ error: error.message })
    }

    return res.status(200).json(data)
  }

  // Get list with filters
  let query = supabaseAdmin.from('course_times').select(
    `
      *,
      courses:course_id (
        id,
        golf_club_name,
        course_name,
        region
      ),
      site_ids:site_id (
        id,
        site_id,
        name
      ),
      users:author_id (
        id,
        name
      )
    `
  )

  // Apply filters
  if (startDate) {
    query = query.gte('reserved_time', startDate)
  }
  if (endDate) {
    query = query.lte('reserved_time', endDate)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (region) {
    query = query.eq('courses.region', region)
  }

  // Order by reserved_time descending
  query = query.order('reserved_time', { ascending: false })

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}

/**
 * POST /api/course-times
 * Create new course time
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const courseTimeData = req.body

  const { data, error } = await supabaseAdmin
    .from('course_times')
    .insert(courseTimeData)
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(201).json(data)
}

/**
 * PUT /api/course-times
 * Update existing course time
 * Body: { id, ...updateData }
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateData } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  const { data, error } = await supabaseAdmin
    .from('course_times')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json(data)
}

/**
 * DELETE /api/course-times
 * Delete course time
 * Body: { id }
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  const { error } = await supabaseAdmin
    .from('course_times')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}

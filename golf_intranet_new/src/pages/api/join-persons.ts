/**
 * API Route: /api/join-persons
 * Handles CRUD operations for join persons
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
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
 * GET /api/join-persons
 * Query params: timeId, id
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { timeId, id } = req.query

  // Get single join person by ID
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('join_persons')
      .select(
        `
        *,
        users:manager_id (
          id,
          name,
          phone_number
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

  // Get list by course time ID
  let query = supabaseAdmin.from('join_persons').select(
    `
      *,
      users:manager_id (
        id,
        name,
        phone_number
      )
    `
  )

  if (timeId) {
    query = query.eq('time_id', timeId)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}

/**
 * POST /api/join-persons
 * Create new join person
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const joinPersonData = req.body

  const { data, error } = await supabaseAdmin
    .from('join_persons')
    .insert(joinPersonData)
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(201).json(data)
}

/**
 * PUT /api/join-persons
 * Update existing join person
 * Body: { id, ...updateData }
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateData } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  const { data, error } = await supabaseAdmin
    .from('join_persons')
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
 * DELETE /api/join-persons
 * Delete join person
 * Body: { id }
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  const { error } = await supabaseAdmin
    .from('join_persons')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}

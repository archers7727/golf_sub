/**
 * API Route: /api/black-lists
 * Handles CRUD operations for black lists
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
 * GET /api/black-lists
 * Query params: id
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // Get single black list by ID
  if (id) {
    const { data, error } = await supabaseAdmin
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
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ error: error.message })
    }

    return res.status(200).json(data)
  }

  // Get all black lists
  const { data, error} = await supabaseAdmin
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

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}

/**
 * POST /api/black-lists
 * Create new black list entry
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const blackListData = req.body

  const { data, error } = await supabaseAdmin
    .from('black_lists')
    .insert(blackListData)
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(201).json(data)
}

/**
 * PUT /api/black-lists
 * Update existing black list entry
 * Body: { id, ...updateData }
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateData } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  const { data, error } = await supabaseAdmin
    .from('black_lists')
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
 * DELETE /api/black-lists
 * Soft delete black list entry (set deleted_at)
 * Body: { id }
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Missing id in request body' })
  }

  // Soft delete
  const { error } = await supabaseAdmin
    .from('black_lists')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}

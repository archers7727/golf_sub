/**
 * API Route: /api/black-lists
 * Handles CRUD operations for black lists
 * Using Prisma ORM for type-safe database access
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    // Get single black list by ID
    if (id && typeof id === 'string') {
      const blackList = await prisma.blackList.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!blackList) {
        return res.status(404).json({ error: 'Black list not found' })
      }

      // Transform to snake_case
      const transformed = {
        ...blackList,
        author_id: blackList.authorId,
        phone_number: blackList.phoneNumber,
        created_at: blackList.createdAt,
        updated_at: blackList.updatedAt,
        deleted_at: blackList.deletedAt,
        users: blackList.author,
      }

      return res.status(200).json(transformed)
    }

    // Get all black lists (not deleted)
    const blackLists = await prisma.blackList.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to snake_case
    const transformed = blackLists.map((bl) => ({
      ...bl,
      author_id: bl.authorId,
      phone_number: bl.phoneNumber,
      created_at: bl.createdAt,
      updated_at: bl.updatedAt,
      deleted_at: bl.deletedAt,
      users: bl.author,
    }))

    return res.status(200).json(transformed)
  } catch (error) {
    console.error('Error fetching black lists:', error)
    return res.status(500).json({ error: 'Failed to fetch black lists' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body

    const prismaData: any = {
      authorId: data.author_id,
      name: data.name,
      phoneNumber: data.phone_number,
      reason: data.reason,
    }

    const blackList = await prisma.blackList.create({
      data: prismaData,
    })

    return res.status(201).json(blackList)
  } catch (error) {
    console.error('Error creating black list:', error)
    return res.status(400).json({ error: 'Failed to create black list' })
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, ...updateData } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    // Convert snake_case to camelCase
    const prismaData: any = {}
    if (updateData.author_id !== undefined) prismaData.authorId = updateData.author_id
    if (updateData.name !== undefined) prismaData.name = updateData.name
    if (updateData.phone_number !== undefined) prismaData.phoneNumber = updateData.phone_number
    if (updateData.reason !== undefined) prismaData.reason = updateData.reason

    const blackList = await prisma.blackList.update({
      where: { id },
      data: prismaData,
    })

    return res.status(200).json(blackList)
  } catch (error) {
    console.error('Error updating black list:', error)
    return res.status(400).json({ error: 'Failed to update black list' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    // Soft delete
    await prisma.blackList.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error deleting black list:', error)
    return res.status(400).json({ error: 'Failed to delete black list' })
  }
}

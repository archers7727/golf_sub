/**
 * API Route: /api/join-persons
 * Handles CRUD operations for join persons
 * Using Prisma ORM for type-safe database access
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Note: Database stores Korean values directly as TEXT
// No enum mapping needed - we pass Korean values straight through

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
    const { timeId, id } = req.query

    // Get single join person by ID
    if (id && typeof id === 'string') {
      const joinPerson = await prisma.joinPerson.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      })

      if (!joinPerson) {
        return res.status(404).json({ error: 'Join person not found' })
      }

      // Transform to snake_case
      const transformed = {
        ...joinPerson,
        manager_id: joinPerson.managerId,
        time_id: joinPerson.timeId,
        join_type: joinPerson.joinType,
        join_num: joinPerson.joinNum,
        phone_number: joinPerson.phoneNumber,
        green_fee: joinPerson.greenFee,
        charge_fee: joinPerson.chargeFee,
        charge_rate: joinPerson.chargeRate,
        refund_reason: joinPerson.refundReason,
        refund_account: joinPerson.refundAccount,
        created_at: joinPerson.createdAt,
        updated_at: joinPerson.updatedAt,
        users: joinPerson.manager ? {
          id: joinPerson.manager.id,
          name: joinPerson.manager.name,
          phone_number: joinPerson.manager.phoneNumber,
        } : null,
      }

      return res.status(200).json(transformed)
    }

    // Get list by course time ID
    const where: any = {}
    if (timeId && typeof timeId === 'string') {
      where.timeId = timeId
    }

    const joinPersons = await prisma.joinPerson.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to snake_case
    const transformed = joinPersons.map((jp) => ({
      ...jp,
      manager_id: jp.managerId,
      time_id: jp.timeId,
      join_type: jp.joinType,
      join_num: jp.joinNum,
      phone_number: jp.phoneNumber,
      green_fee: jp.greenFee,
      charge_fee: jp.chargeFee,
      charge_rate: jp.chargeRate,
      refund_reason: jp.refundReason,
      refund_account: jp.refundAccount,
      created_at: jp.createdAt,
      updated_at: jp.updatedAt,
      users: jp.manager ? {
        id: jp.manager.id,
        name: jp.manager.name,
        phone_number: jp.manager.phoneNumber,
      } : null,
    }))

    return res.status(200).json(transformed)
  } catch (error) {
    console.error('Error fetching join persons:', error)
    return res.status(500).json({ error: 'Failed to fetch join persons' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body
    console.log('[JOIN-PERSON POST] Received data:', JSON.stringify(data, null, 2))

    // Database stores Korean values directly - no mapping needed
    const prismaData: any = {
      managerId: data.manager_id,
      timeId: data.time_id,
      name: data.name,
      joinType: data.join_type || '남', // Default to '남' if not provided
      joinNum: data.join_num,
      phoneNumber: data.phone_number,
      greenFee: data.green_fee ?? 0,
      chargeFee: data.charge_fee ?? 0,
      chargeRate: data.charge_rate ?? 0,
      status: data.status || '입금확인전', // Default to '입금확인전' if not provided
      refundReason: data.refund_reason,
      refundAccount: data.refund_account,
    }

    console.log('[JOIN-PERSON POST] Prisma data:', JSON.stringify(prismaData, null, 2))

    const joinPerson = await prisma.joinPerson.create({
      data: prismaData,
    })

    console.log('[JOIN-PERSON POST] Successfully created:', joinPerson.id)
    return res.status(201).json(joinPerson)
  } catch (error) {
    console.error('[JOIN-PERSON POST] Error creating join person:', error)
    if (error instanceof Error) {
      console.error('[JOIN-PERSON POST] Error message:', error.message)
      console.error('[JOIN-PERSON POST] Error stack:', error.stack)
    }
    return res.status(400).json({
      error: 'Failed to create join person',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, ...updateData } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    // Convert snake_case to camelCase - Korean values passed through as-is
    const prismaData: any = {}
    if (updateData.manager_id !== undefined) prismaData.managerId = updateData.manager_id
    if (updateData.time_id !== undefined) prismaData.timeId = updateData.time_id
    if (updateData.name !== undefined) prismaData.name = updateData.name
    if (updateData.join_type !== undefined) prismaData.joinType = updateData.join_type
    if (updateData.join_num !== undefined) prismaData.joinNum = updateData.join_num
    if (updateData.phone_number !== undefined) prismaData.phoneNumber = updateData.phone_number
    if (updateData.green_fee !== undefined) prismaData.greenFee = updateData.green_fee
    if (updateData.charge_fee !== undefined) prismaData.chargeFee = updateData.charge_fee
    if (updateData.charge_rate !== undefined) prismaData.chargeRate = updateData.charge_rate
    if (updateData.status !== undefined) prismaData.status = updateData.status
    if (updateData.refund_reason !== undefined) prismaData.refundReason = updateData.refund_reason
    if (updateData.refund_account !== undefined) prismaData.refundAccount = updateData.refund_account

    const joinPerson = await prisma.joinPerson.update({
      where: { id },
      data: prismaData,
    })

    return res.status(200).json(joinPerson)
  } catch (error) {
    console.error('Error updating join person:', error)
    return res.status(400).json({ error: 'Failed to update join person' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Missing id in request body' })
    }

    await prisma.joinPerson.delete({
      where: { id },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error deleting join person:', error)
    return res.status(400).json({ error: 'Failed to delete join person' })
  }
}

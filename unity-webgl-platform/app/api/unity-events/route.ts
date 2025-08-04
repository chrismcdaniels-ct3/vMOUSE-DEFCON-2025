import { NextRequest, NextResponse } from 'next/server'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/amplify/data/resource'

const client = generateClient<Schema>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, sessionId, eventType, eventData } = body

    if (!pageId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store the event in DynamoDB
    const event = await client.models.Entity.create({
      pk: `SESSION#${sessionId}`,
      sk: `EVENT#${Date.now()}#${Math.random().toString(36).substr(2, 9)}`,
      type: 'UNITY_EVENT',
      pageId,
      sessionId,
      eventType,
      eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gsi1pk: `PAGE#${pageId}`,
      gsi1sk: `EVENT#${Date.now()}`,
    })

    return NextResponse.json({
      success: true,
      eventId: event.data?.pk,
    })
  } catch (error) {
    console.error('Error processing Unity event:', error)
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    )
  }
}
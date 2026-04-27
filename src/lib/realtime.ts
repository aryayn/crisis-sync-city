import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type IncidentEvent = {
  eventType: 'created' | 'updated' | 'status_changed'
  incident: any
}

type ResponderEvent = {
  eventType: 'status_changed' | 'location_updated'
  responder: any
}

let incidentChannels: Map<string, RealtimeChannel> = new Map()
let responderChannels: Map<string, RealtimeChannel> = new Map()

export function subscribeToIncidents(buildingId: string, callback: (event: IncidentEvent) => void) {
  const channelName = `incidents:${buildingId}`

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incidents',
        filter: `building_id=eq.${buildingId}`,
      },
      (payload: any) => {
        const eventType =
          payload.eventType === 'INSERT'
            ? 'created'
            : payload.eventType === 'UPDATE'
              ? 'updated'
              : 'status_changed'

        callback({
          eventType: eventType as any,
          incident: payload.new,
        })
      }
    )
    .subscribe()

  incidentChannels.set(buildingId, channel)

  return () => {
    channel.unsubscribe()
    incidentChannels.delete(buildingId)
  }
}

export function subscribeToResponders(buildingId: string, callback: (event: ResponderEvent) => void) {
  const channelName = `responders:${buildingId}`

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'responders',
        filter: `building_id=eq.${buildingId}`,
      },
      (payload: any) => {
        const oldStatus = payload.old?.status
        const newStatus = payload.new?.status

        const eventType = oldStatus !== newStatus ? 'status_changed' : 'location_updated'

        callback({
          eventType: eventType as any,
          responder: payload.new,
        })
      }
    )
    .subscribe()

  responderChannels.set(buildingId, channel)

  return () => {
    channel.unsubscribe()
    responderChannels.delete(buildingId)
  }
}

export function unsubscribeFromIncidents(buildingId: string) {
  const channel = incidentChannels.get(buildingId)
  if (channel) {
    channel.unsubscribe()
    incidentChannels.delete(buildingId)
  }
}

export function unsubscribeFromResponders(buildingId: string) {
  const channel = responderChannels.get(buildingId)
  if (channel) {
    channel.unsubscribe()
    responderChannels.delete(buildingId)
  }
}

export function broadcastIncidentUpdate(incident: any) {
  const channel = supabase.channel(`incident:${incident.id}`)
  channel.send({
    type: 'broadcast',
    event: 'incident_update',
    payload: incident,
  })
}

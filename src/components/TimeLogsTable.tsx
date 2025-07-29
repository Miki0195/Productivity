import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'
import { supabase, TimeLog } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function TimeLogsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTodaysLogs = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${today}T00:00:00.000Z`)
        .lt('start_time', `${today}T23:59:59.999Z`)
        .order('start_time', { ascending: false })

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching time logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysLogs()
  }, [user, refreshTrigger])

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTotalTime = (): string => {
    const totalMs = logs.reduce((acc, log) => {
      const start = new Date(log.start_time)
      const end = new Date(log.end_time)
      return acc + (end.getTime() - start.getTime())
    }, 0)

    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Today's Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Today's Logs
          </span>
          {logs.length > 0 && (
            <span className="text-sm font-normal text-blue-600">
              Total: {getTotalTime()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No time logs for today. Start tracking to see your logs here!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatTime(log.start_time)}</TableCell>
                  <TableCell>{formatTime(log.end_time)}</TableCell>
                  <TableCell className="font-medium">
                    {calculateDuration(log.start_time, log.end_time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 
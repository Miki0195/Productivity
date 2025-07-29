import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Square, Clock } from 'lucide-react'
import { supabase, WorkSessionData } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import WorkSessionModal from '@/components/WorkSessionModal'

interface ActiveSession {
  startTime: string
  sessionId: string
}

export default function TimeTracker({ onLogAdded }: { onLogAdded: () => void }) {
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null)
  const { user } = useAuth()

  // Load active session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('activeTimeSession')
    if (savedSession) {
      try {
        const session: ActiveSession = JSON.parse(savedSession)
        const savedStartTime = new Date(session.startTime)
        setStartTime(savedStartTime)
        setIsTracking(true)
      } catch (error) {
        // Clear invalid session data
        localStorage.removeItem('activeTimeSession')
      }
    }
  }, [])

  // Update elapsed time every second when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime])

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const startWork = () => {
    const now = new Date()
    setStartTime(now)
    setIsTracking(true)
    setElapsedTime(0)

    // Save to localStorage for persistence
    const session: ActiveSession = {
      startTime: now.toISOString(),
      sessionId: crypto.randomUUID(),
    }
    localStorage.setItem('activeTimeSession', JSON.stringify(session))
  }

  const stopWork = () => {
    if (!startTime) return

    const endTime = new Date()
    setSessionEndTime(endTime)
    setIsTracking(false)
    
    // Clear localStorage
    localStorage.removeItem('activeTimeSession')
    
    // Show modal for session details
    setShowModal(true)
  }

  const saveSession = async (sessionData: WorkSessionData) => {
    if (!startTime || !sessionEndTime || !user) return

    setLoading(true)
    try {
      // Save to Supabase with session details
      const { error } = await supabase
        .from('time_logs')
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: sessionEndTime.toISOString(),
          title: sessionData.title || null,
          project: sessionData.project || null,
          description: sessionData.description || null,
        })

      if (error) throw error

      // Reset state
      setStartTime(null)
      setElapsedTime(0)
      setSessionEndTime(null)
      setShowModal(false)

      // Notify parent to refresh logs
      onLogAdded()
    } catch (error) {
      console.error('Error saving time log:', error)
      alert('Failed to save time log. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const skipDetails = async () => {
    // Save session without details
    await saveSession({ title: '', project: '', description: '' })
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isTracking && (
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Started at {startTime?.toLocaleTimeString()}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            {!isTracking ? (
              <Button
                onClick={startWork}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Work
              </Button>
            ) : (
              <Button
                onClick={stopWork}
                disabled={loading}
                size="lg"
                variant="destructive"
                className="px-8 py-3"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Work
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Session Modal */}
      <WorkSessionModal
        isOpen={showModal}
        onClose={skipDetails}
        onSave={saveSession}
        duration={formatDuration(elapsedTime)}
        loading={loading}
      />
    </>
  )
} 
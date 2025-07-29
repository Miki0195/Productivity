import { useState } from 'react'
import TimeTracker from '@/components/TimeTracker'
import TimeLogsTable from '@/components/TimeLogsTable'

export default function TimerPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleLogAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Time Tracker */}
        <div className="flex justify-center">
          <TimeTracker onLogAdded={handleLogAdded} />
        </div>

        {/* Time Logs Table */}
        <TimeLogsTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
} 
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from '@/components/Navigation'
import TimerPage from '@/pages/TimerPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import LogsPage from '@/pages/LogsPage'

export default function Dashboard() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<TimerPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
} 
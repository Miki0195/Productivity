import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Clock, Calendar, TrendingUp } from 'lucide-react'
import { supabase, TimeLog } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  endOfWeek, 
  endOfMonth, 
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  differenceInDays,
  isSameDay,
  isSameWeek,
  addDays
} from 'date-fns'

interface ChartData {
  label: string
  hours: number
  sessions: number
}

type FilterType = 'today' | 'week' | 'month' | 'year' | 'custom' | null

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const { user } = useAuth()

  const fetchLogs = async (start: string, end: string) => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${start}T00:00:00.000Z`)
        .lte('start_time', `${end}T23:59:59.999Z`)
        .order('start_time', { ascending: true })

      if (error) throw error

      setLogs(data || [])
      processChartData(data || [], start, end)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (logs: TimeLog[], start: string, end: string) => {
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)

    let data: ChartData[] = []

    switch (activeFilter) {
      case 'today':
        data = processDayData(logs, startDateObj)
        break
      case 'week':
        data = processWeekData(logs, startDateObj)
        break
      case 'month':
        data = processMonthData(logs, startDateObj)
        break
      case 'year':
        data = processYearData(logs, startDateObj)
        break
      case 'custom':
        data = processCustomData(logs, startDateObj, endDateObj)
        break
      default:
        data = processCustomData(logs, startDateObj, endDateObj)
    }

    setChartData(data)
  }

  const processDayData = (logs: TimeLog[], date: Date): ChartData[] => {
    const hours = logs.reduce((total, log) => {
      const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
      return total + duration / (1000 * 60 * 60)
    }, 0)

    return [{
      label: format(date, 'MMM dd'),
      hours,
      sessions: logs.length
    }]
  }

  const processWeekData = (logs: TimeLog[], startDate: Date): ChartData[] => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    })

    return days.map(day => {
      const dayLogs = logs.filter(log => 
        isSameDay(new Date(log.start_time), day)
      )
      
      const hours = dayLogs.reduce((total, log) => {
        const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
        return total + duration / (1000 * 60 * 60)
      }, 0)

      return {
        label: format(day, 'EEE dd'),
        hours,
        sessions: dayLogs.length
      }
    })
  }

  const processMonthData = (logs: TimeLog[], startDate: Date): ChartData[] => {
    const monthStart = startOfMonth(startDate)
    const monthEnd = endOfMonth(startDate)
    
    const weeks = eachWeekOfInterval({
      start: monthStart,
      end: monthEnd
    }, { weekStartsOn: 1 })

    return weeks.map((weekStart, index) => {
      const weekEnd = addDays(weekStart, 6)
      
      // Adjust week boundaries to stay within the month
      const actualStart = weekStart < monthStart ? monthStart : weekStart
      const actualEnd = weekEnd > monthEnd ? monthEnd : weekEnd
      
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.start_time)
        return logDate >= actualStart && logDate <= actualEnd
      })
      
      const hours = weekLogs.reduce((total, log) => {
        const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
        return total + duration / (1000 * 60 * 60)
      }, 0)

      // Format the label with actual dates in DD.MM format
      const startLabel = format(actualStart, 'dd.MM')
      const endLabel = format(actualEnd, 'dd.MM')

      return {
        label: `${startLabel}-${endLabel}`,
        hours,
        sessions: weekLogs.length
      }
    })
  }

  const processYearData = (logs: TimeLog[], startDate: Date): ChartData[] => {
    const yearStart = startOfYear(startDate)
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(yearStart.getFullYear(), i, 1)
      return monthStart
    })

    return months.map(month => {
      const monthLogs = logs.filter(log => {
        const logDate = new Date(log.start_time)
        return logDate.getMonth() === month.getMonth() && 
               logDate.getFullYear() === month.getFullYear()
      })
      
      const hours = monthLogs.reduce((total, log) => {
        const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
        return total + duration / (1000 * 60 * 60)
      }, 0)

      return {
        label: format(month, 'MMM'),
        hours,
        sessions: monthLogs.length
      }
    })
  }

  const processCustomData = (logs: TimeLog[], startDate: Date, endDate: Date): ChartData[] => {
    const daysDiff = differenceInDays(endDate, startDate) + 1

    // For ranges <= 7 days, show daily breakdown
    if (daysDiff <= 7) {
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      return days.map(day => {
        const dayLogs = logs.filter(log => 
          isSameDay(new Date(log.start_time), day)
        )
        
        const hours = dayLogs.reduce((total, log) => {
          const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
          return total + duration / (1000 * 60 * 60)
        }, 0)

        return {
          label: format(day, 'MMM dd'),
          hours,
          sessions: dayLogs.length
        }
      })
    }

    // For ranges > 7 days but <= 60 days, show weekly breakdown
    if (daysDiff <= 60) {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 })
      return weeks.map((weekStart, index) => {
        const weekEnd = addDays(weekStart, 6)
        const weekLogs = logs.filter(log => {
          const logDate = new Date(log.start_time)
          return logDate >= weekStart && logDate <= weekEnd && 
                 logDate >= startDate && logDate <= endDate
        })
        
        const hours = weekLogs.reduce((total, log) => {
          const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
          return total + duration / (1000 * 60 * 60)
        }, 0)

        return {
          label: `Week ${index + 1}`,
          hours,
          sessions: weekLogs.length
        }
      })
    }

    // For longer ranges, show monthly breakdown
    const months: Date[] = []
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    while (current <= endMonth) {
      months.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }

    return months.map(month => {
      const monthLogs = logs.filter(log => {
        const logDate = new Date(log.start_time)
        return logDate.getMonth() === month.getMonth() && 
               logDate.getFullYear() === month.getFullYear() &&
               logDate >= startDate && logDate <= endDate
      })
      
      const hours = monthLogs.reduce((total, log) => {
        const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
        return total + duration / (1000 * 60 * 60)
      }, 0)

      return {
        label: format(month, 'MMM yyyy'),
        hours,
        sessions: monthLogs.length
      }
    })
  }

  useEffect(() => {
    fetchLogs(startDate, endDate)
  }, [user, startDate, endDate, activeFilter])

  const handleQuickSelect = (range: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date()
    let start: Date, end: Date

    switch (range) {
      case 'today':
        start = end = now
        break
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 })
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
    setActiveFilter(range)
  }

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    setActiveFilter('custom')
  }

  const calculateTotalHours = () => {
    return logs.reduce((total, log) => {
      const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
      return total + duration / (1000 * 60 * 60)
    }, 0)
  }

  const calculateAvgHoursPerDay = () => {
    const totalHours = calculateTotalHours()
    
    if (activeFilter === 'today') {
      return totalHours // For today, avg = total
    }
    
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const totalDays = differenceInDays(endDateObj, startDateObj) + 1
    
    return totalHours / totalDays
  }

  const getChartTitle = () => {
    switch (activeFilter) {
      case 'today':
        return 'Today\'s Hours'
      case 'week':
        return 'Weekly Hours Worked'
      case 'month':
        return 'Monthly Hours by Week'
      case 'year':
        return 'Yearly Hours by Month'
      case 'custom':
        return `Hours Worked (${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd')})`
      default:
        return 'Hours Worked'
    }
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const exportToPDF = async () => {
    const element = document.getElementById('analytics-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`time-tracker-report-${startDate}-to-${endDate}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const totalHours = calculateTotalHours()
  const avgHoursPerDay = calculateAvgHoursPerDay()
  const totalSessions = logs.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  activeFilter={activeFilter}
                  onStartDateChange={(date) => handleDateChange(date, endDate)}
                  onEndDateChange={(date) => handleDateChange(startDate, date)}
                  onQuickSelect={handleQuickSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6" id="analytics-content">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Hours</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatHours(totalHours)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Avg/Day</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatHours(avgHoursPerDay)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{getChartTitle()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatHours(value), 'Hours']}
                      />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Log</CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No data found for the selected period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.start_time), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.start_time), 'HH:mm')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.end_time), 'HH:mm')}
                          </TableCell>
                          <TableCell>
                            {formatHours(
                              (new Date(log.end_time).getTime() - 
                               new Date(log.start_time).getTime()) / (1000 * 60 * 60)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
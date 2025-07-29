import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-picker'
import ProjectFilter from '@/components/ui/project-filter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, Calendar, Download, TrendingUp, BarChart3 } from 'lucide-react'
import { supabase, TimeLog } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, addDays, differenceInDays, startOfDay, addWeeks } from 'date-fns'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type FilterType = 'today' | 'week' | 'month' | 'year' | 'custom' | null

interface ChartData {
  name: string
  hours: number
  label?: string
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [allProjects, setAllProjects] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch available projects for the current date range
  const fetchAvailableProjects = async (start: string, end: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('project')
        .eq('user_id', user.id)
        .gte('start_time', `${start}T00:00:00.000Z`)
        .lte('start_time', `${end}T23:59:59.999Z`)
        .not('project', 'is', null)

      if (error) throw error

      const projects = [...new Set(data?.map(log => log.project).filter(Boolean) as string[])]
      setAllProjects(projects.sort())
    } catch (error) {
      console.error('Error fetching projects:', error)
      setAllProjects([])
    }
  }

  const fetchLogs = async (start: string, end: string, projectFilter: string | null = null) => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${start}T00:00:00.000Z`)
        .lte('start_time', `${end}T23:59:59.999Z`)

      // Add project filter if selected
      if (projectFilter) {
        query = query.eq('project', projectFilter)
      }

      const { data, error } = await query.order('start_time', { ascending: true })

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchAvailableProjects(startDate, endDate)
      await fetchLogs(startDate, endDate, selectedProject)
    }
    fetchData()
  }, [user, startDate, endDate, selectedProject])

  useEffect(() => {
    if (logs.length > 0) {
      processChartData()
    } else {
      setChartData([])
    }
  }, [logs, activeFilter, startDate, endDate])

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
    // Reset project filter when changing date range
    setSelectedProject(null)
  }

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    setActiveFilter('custom')
    // Reset project filter when changing date range
    setSelectedProject(null)
  }

  const handleProjectSelect = (project: string | null) => {
    setSelectedProject(project)
  }

  const processChartData = () => {
    if (!logs.length) {
      setChartData([])
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = differenceInDays(end, start)

    if (activeFilter === 'today') {
      processDayData()
    } else if (activeFilter === 'week') {
      processWeekData()
    } else if (activeFilter === 'month') {
      processMonthData()
    } else if (activeFilter === 'year') {
      processYearData()
    } else if (activeFilter === 'custom') {
      processCustomData(daysDiff)
    }
  }

  const processDayData = () => {
    // For single day, show hourly breakdown
    const hourlyData: { [key: string]: number } = {}
    
    logs.forEach(log => {
      const startHour = new Date(log.start_time).getHours()
      const endHour = new Date(log.end_time).getHours()
      const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
      
      for (let hour = startHour; hour <= endHour; hour++) {
        if (!hourlyData[hour]) hourlyData[hour] = 0
        hourlyData[hour] += duration / (endHour - startHour + 1)
      }
    })

    const data = Array.from({ length: 24 }, (_, i) => ({
      name: `${i.toString().padStart(2, '0')}:00`,
      hours: hourlyData[i] || 0
    })).filter(item => item.hours > 0)

    setChartData(data)
  }

  const processWeekData = () => {
    const start = startOfWeek(new Date(startDate), { weekStartsOn: 1 })
    const dailyData: { [key: string]: number } = {}
    
    // Initialize all days of the week
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i)
      const dayKey = format(day, 'yyyy-MM-dd')
      dailyData[dayKey] = 0
    }

    logs.forEach(log => {
      const logDate = format(new Date(log.start_time), 'yyyy-MM-dd')
      const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
      if (dailyData.hasOwnProperty(logDate)) {
        dailyData[logDate] += duration
      }
    })

    const data = Object.entries(dailyData).map(([date, hours]) => ({
      name: format(new Date(date), 'EEE'),
      hours,
      label: format(new Date(date), 'dd.MM')
    }))

    setChartData(data)
  }

  const processMonthData = () => {
    const start = startOfMonth(new Date(startDate))
    const end = endOfMonth(new Date(startDate))
    const weeklyData: { [key: string]: { hours: number; actualStart: Date; actualEnd: Date } } = {}
    
    // Initialize weeks in the month
    let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 })
    let weekIndex = 1
    
    while (currentWeekStart <= end) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const actualStart = currentWeekStart < start ? start : currentWeekStart
      const actualEnd = currentWeekEnd > end ? end : currentWeekEnd
      
      weeklyData[`Week ${weekIndex}`] = { 
        hours: 0, 
        actualStart, 
        actualEnd 
      }
      
      currentWeekStart = addWeeks(currentWeekStart, 1)
      weekIndex++
    }

    logs.forEach(log => {
      const logDate = new Date(log.start_time)
      const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
      
      // Find which week this log belongs to
      Object.entries(weeklyData).forEach(([weekKey, weekData]) => {
        if (logDate >= weekData.actualStart && logDate <= weekData.actualEnd) {
          weeklyData[weekKey].hours += duration
        }
      })
    })

    const data = Object.entries(weeklyData).map(([, data]) => ({
      name: `${format(data.actualStart, 'dd.MM')}-${format(data.actualEnd, 'dd.MM')}`,
      hours: data.hours
    }))

    setChartData(data)
  }

  const processYearData = () => {
    const monthlyData: { [key: string]: number } = {}
    
    // Initialize all months
    for (let i = 0; i < 12; i++) {
      const month = format(new Date(2024, i, 1), 'MMM')
      monthlyData[month] = 0
    }

    logs.forEach(log => {
      const month = format(new Date(log.start_time), 'MMM')
      const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
      monthlyData[month] += duration
    })

    const data = Object.entries(monthlyData).map(([month, hours]) => ({
      name: month,
      hours
    }))

    setChartData(data)
  }

  const processCustomData = (daysDiff: number) => {
    if (daysDiff <= 7) {
      // Daily breakdown for week or less
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dailyData: { [key: string]: number } = {}
      
      // Initialize all days in range
      for (let date = startOfDay(start); date <= end; date = addDays(date, 1)) {
        const dayKey = format(date, 'yyyy-MM-dd')
        dailyData[dayKey] = 0
      }

      logs.forEach(log => {
        const logDate = format(new Date(log.start_time), 'yyyy-MM-dd')
        const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
        if (dailyData.hasOwnProperty(logDate)) {
          dailyData[logDate] += duration
        }
      })

      const data = Object.entries(dailyData).map(([date, hours]) => ({
        name: format(new Date(date), 'dd.MM'),
        hours
      }))

      setChartData(data)
    } else if (daysDiff <= 90) {
      // Weekly breakdown for 3 months or less
      const start = startOfWeek(new Date(startDate), { weekStartsOn: 1 })
      const end = new Date(endDate)
      const weeklyData: { [key: string]: number } = {}
      
      let currentWeek = start
      while (currentWeek <= end) {
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
        const weekKey = `${format(currentWeek, 'dd.MM')}-${format(weekEnd > end ? end : weekEnd, 'dd.MM')}`
        weeklyData[weekKey] = 0
        currentWeek = addWeeks(currentWeek, 1)
      }

      logs.forEach(log => {
        const logDate = new Date(log.start_time)
        const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
        
        Object.keys(weeklyData).forEach(weekKey => {
          const [startStr, endStr] = weekKey.split('-')
          const weekStart = new Date(`2024-${startStr.split('.').reverse().join('-')}`)
          const weekEnd = new Date(`2024-${endStr.split('.').reverse().join('-')}`)
          
          if (logDate >= weekStart && logDate <= weekEnd) {
            weeklyData[weekKey] += duration
          }
        })
      })

      const data = Object.entries(weeklyData).map(([week, hours]) => ({
        name: week,
        hours
      }))

      setChartData(data)
    } else {
      // Monthly breakdown for longer periods
      const monthlyData: { [key: string]: number } = {}
      
      logs.forEach(log => {
        const month = format(new Date(log.start_time), 'MMM yyyy')
        const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60 * 60)
        if (!monthlyData[month]) monthlyData[month] = 0
        monthlyData[month] += duration
      })

      const data = Object.entries(monthlyData).map(([month, hours]) => ({
        name: month,
        hours
      }))

      setChartData(data)
    }
  }

  const calculateTotalHours = () => {
    return logs.reduce((total, log) => {
      const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
      return total + duration / (1000 * 60 * 60)
    }, 0)
  }

  const calculateAvgHoursPerDay = () => {
    if (!logs.length) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = differenceInDays(end, start) + 1
    const totalHours = calculateTotalHours()
    
    return totalHours / totalDays
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getChartTitle = () => {
    const projectPrefix = selectedProject ? `${selectedProject} - ` : ''
    
    switch (activeFilter) {
      case 'today':
        return `${projectPrefix}Hourly Breakdown - ${format(new Date(startDate), 'MMMM dd, yyyy')}`
      case 'week':
        return `${projectPrefix}Daily Hours This Week`
      case 'month':
        return `${projectPrefix}Weekly Hours This Month`
      case 'year':
        return `${projectPrefix}Monthly Hours This Year`
      case 'custom':
        const daysDiff = differenceInDays(new Date(endDate), new Date(startDate))
        if (daysDiff <= 7) {
          return `${projectPrefix}Daily Hours - ${format(new Date(startDate), 'MMM dd')} to ${format(new Date(endDate), 'MMM dd, yyyy')}`
        } else if (daysDiff <= 90) {
          return `${projectPrefix}Weekly Hours - ${format(new Date(startDate), 'MMM dd')} to ${format(new Date(endDate), 'MMM dd, yyyy')}`
        } else {
          return `${projectPrefix}Monthly Hours - ${format(new Date(startDate), 'MMM yyyy')} to ${format(new Date(endDate), 'MMM yyyy')}`
        }
      default:
        return `${projectPrefix}Hours Worked`
    }
  }

  const exportToPDF = async () => {
    const element = document.getElementById('analytics-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
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
      
      const filename = selectedProject 
        ? `${selectedProject}_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`
        : `time_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      
      pdf.save(filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

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

  const totalHours = calculateTotalHours()
  const avgHoursPerDay = calculateAvgHoursPerDay()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6" id="analytics-content">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              {selectedProject 
                ? `Time tracking insights for "${selectedProject}" project`
                : 'Insights into your time tracking patterns'
              }
            </p>
          </div>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  activeFilter={activeFilter}
                  onStartDateChange={(date) => handleDateChange(date, endDate)}
                  onEndDateChange={(date) => handleDateChange(startDate, date)}
                  onQuickSelect={handleQuickSelect}
                />
                
                <div className="border-t border-gray-200 pt-4">
                  <ProjectFilter
                    projects={allProjects}
                    selectedProject={selectedProject}
                    onProjectSelect={handleProjectSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Hours</p>
                      <p className="text-2xl font-bold text-gray-900">{formatHours(totalHours)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg/Day</p>
                      <p className="text-2xl font-bold text-gray-900">{formatHours(avgHoursPerDay)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {getChartTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatHours(value as number), 'Hours']}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No data to display</h3>
                    <p className="text-gray-600">
                      {selectedProject 
                        ? `No time logs found for "${selectedProject}" in the selected period.`
                        : 'No time logs found for the selected period.'
                      }
                    </p>
                    {selectedProject && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProject(null)}
                        className="mt-4"
                      >
                        View All Projects
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(new Date(log.start_time), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{log.title || 'Untitled'}</TableCell>
                          <TableCell>{log.project || '-'}</TableCell>
                          <TableCell>{format(new Date(log.start_time), 'HH:mm')}</TableCell>
                          <TableCell>{format(new Date(log.end_time), 'HH:mm')}</TableCell>
                          <TableCell>
                            {(() => {
                              const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
                              const hours = Math.floor(duration / (1000 * 60 * 60))
                              const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
                              return `${hours}h ${minutes}m`
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No sessions found for the selected period.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
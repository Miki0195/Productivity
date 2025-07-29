import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import ProjectFilter from '@/components/ui/project-filter'
import { Clock, Calendar, FileText, FolderOpen, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { supabase, TimeLog, WorkSessionData } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns'
import WorkSessionModal from '@/components/WorkSessionModal'
import PasswordConfirmationModal from '@/components/PasswordConfirmationModal'

type FilterType = 'today' | 'week' | 'month' | 'year' | 'custom' | null

export default function LogsPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [allProjects, setAllProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  
  // Edit session modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSession, setEditingSession] = useState<TimeLog | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deletingSession, setDeletingSession] = useState<TimeLog | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Password confirmation for edit
  const [showEditPasswordConfirm, setShowEditPasswordConfirm] = useState(false)
  const [pendingEditSession, setPendingEditSession] = useState<TimeLog | null>(null)
  
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

      const { data, error } = await query.order('start_time', { ascending: false })

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

  const formatDuration = (startTime: string, endTime: string): string => {
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

  const getTotalHours = () => {
    return logs.reduce((total, log) => {
      const duration = new Date(log.end_time).getTime() - new Date(log.start_time).getTime()
      return total + duration / (1000 * 60 * 60)
    }, 0)
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getUniqueProjects = () => {
    const projects = logs
      .map(log => log.project)
      .filter((project): project is string => Boolean(project))
    return [...new Set(projects)]
  }

  // Edit session handlers
  const handleEditClick = (session: TimeLog) => {
    setPendingEditSession(session)
    setShowEditPasswordConfirm(true)
  }

  const handleEditPasswordConfirm = () => {
    if (pendingEditSession) {
      setEditingSession(pendingEditSession)
      setShowEditModal(true)
      setPendingEditSession(null)
    }
  }

  const handleEditSave = async (data: WorkSessionData) => {
    if (!editingSession) return

    setEditLoading(true)
    try {
      const { error } = await supabase
        .from('time_logs')
        .update({
          title: data.title || null,
          project: data.project || null,
          description: data.description || null,
        })
        .eq('id', editingSession.id)

      if (error) throw error

      // Refresh available projects and logs
      await fetchAvailableProjects(startDate, endDate)
      await fetchLogs(startDate, endDate, selectedProject)
      setShowEditModal(false)
      setEditingSession(null)
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Failed to update session. Please try again.')
    } finally {
      setEditLoading(false)
    }
  }

  // Delete session handlers
  const handleDeleteClick = (session: TimeLog) => {
    setDeletingSession(session)
    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', deletingSession.id)

      if (error) throw error

      // Refresh available projects and logs
      await fetchAvailableProjects(startDate, endDate)
      await fetchLogs(startDate, endDate, selectedProject)
      setShowDeleteConfirmation(false)
      setDeletingSession(null)
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalHours = getTotalHours()
  const uniqueProjects = getUniqueProjects()

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Work Sessions</h1>
              <p className="text-gray-600 mt-1">
                {selectedProject 
                  ? `Detailed view of your "${selectedProject}" project sessions`
                  : 'Detailed view of your work history'
                }
              </p>
            </div>
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

              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedProject ? `${selectedProject} Summary` : 'Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Time</p>
                      <p className="font-semibold">{formatHours(totalHours)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Sessions</p>
                      <p className="font-semibold">{logs.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedProject ? 'Project' : 'Projects'}
                      </p>
                      <p className="font-semibold">
                        {selectedProject ? selectedProject : `${uniqueProjects.length} project${uniqueProjects.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logs List */}
            <div className="lg:col-span-3">
              {logs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedProject ? `No "${selectedProject}" sessions found` : 'No sessions found'}
                    </h3>
                    <p className="text-gray-600">
                      {selectedProject 
                        ? `No work sessions found for the "${selectedProject}" project in the selected period.`
                        : 'No work sessions found for the selected period.'
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
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <Card key={log.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {log.title || 'Untitled Session'}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(log.start_time), 'MMM dd, yyyy')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(log.start_time), 'HH:mm')} - {format(new Date(log.end_time), 'HH:mm')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div className="text-lg font-bold text-blue-600">
                                  {formatDuration(log.start_time, log.end_time)}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditClick(log)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(log)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Project Badge */}
                            {log.project && (
                              <div>
                                <Badge 
                                  variant="outline" 
                                  className={`flex items-center gap-1 w-fit ${
                                    selectedProject === log.project ? 'bg-blue-50 border-blue-200 text-blue-700' : ''
                                  }`}
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  {log.project}
                                </Badge>
                              </div>
                            )}

                            {/* Description */}
                            {log.description && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {log.description}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Session Modal */}
      <WorkSessionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingSession(null)
        }}
        onSave={handleEditSave}
        loading={editLoading}
        editSession={editingSession}
        mode="edit"
      />

      {/* Password Confirmation for Edit */}
      <PasswordConfirmationModal
        isOpen={showEditPasswordConfirm}
        onClose={() => {
          setShowEditPasswordConfirm(false)
          setPendingEditSession(null)
        }}
        onConfirm={handleEditPasswordConfirm}
        title="Confirm Edit"
        description="Please enter your password to edit this work session."
        actionLabel="Confirm Edit"
        variant="default"
      />

      {/* Delete Confirmation Modal */}
      <PasswordConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false)
          setDeletingSession(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Work Session"
        description={`Are you sure you want to delete "${deletingSession?.title || 'this session'}"? This action cannot be undone.`}
        actionLabel="Delete Session"
        variant="destructive"
        loading={deleteLoading}
      />
    </>
  )
} 
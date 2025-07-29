import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  StickyNote,
  Plus,
  Search,
  FolderPlus,
  Star,
  Archive,
  MoreVertical,
  ArrowLeft,
  Trash2,
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  Tag,
  Hash,
  Filter,
  Clock,
  FolderOpen,
  Folder as FolderIcon,
  Save,
} from 'lucide-react'
import { supabase, Note, Folder, Goal } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all')
  
  // Note editing state
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState({ title: '', content: '', tags: '' })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Goal editing state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [editingGoalContent, setEditingGoalContent] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as Goal['priority'], 
    due_date: '' 
  })
  const [hasUnsavedGoalChanges, setHasUnsavedGoalChanges] = useState(false)
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  
  // Modals
  const [showNewNote, setShowNewNote] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewGoal, setShowNewGoal] = useState(false)
  
  // Forms
  const [noteForm, setNoteForm] = useState({ title: '', content: '', tags: '' })
  const [folderForm, setFolderForm] = useState({ name: '', color: '#3B82F6' })
  const [goalForm, setGoalForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as Goal['priority'], 
    due_date: '' 
  })
  
  const { user } = useAuth()

  const folderColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, showArchived])

  // Auto-save effect for note editing
  useEffect(() => {
    if (selectedNote && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        saveNoteChanges()
      }, 1000) // Auto-save after 1 second of no changes

      return () => clearTimeout(timer)
    }
  }, [editingNoteContent, hasUnsavedChanges])

  // Auto-save effect for goal editing
  useEffect(() => {
    if (selectedGoal && hasUnsavedGoalChanges) {
      const timer = setTimeout(() => {
        saveGoalChanges()
      }, 1000) // Auto-save after 1 second of no changes

      return () => clearTimeout(timer)
    }
  }, [editingGoalContent, hasUnsavedGoalChanges])

  const fetchData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (foldersError) throw foldersError
      setFolders(foldersData || [])
      
      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', showArchived)
        .order('updated_at', { ascending: false })
      
      if (notesError) throw notesError
      setNotes(notesData || [])
      
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (goalsError) throw goalsError
      setGoals(goalsData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openNote = (note: Note) => {
    if (hasUnsavedChanges) {
      saveNoteChanges()
    }
    if (hasUnsavedGoalChanges) {
      saveGoalChanges()
    }
    
    setSelectedNote(note)
    setSelectedGoal(null) // Close goal if open
    setEditingNoteContent({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', ')
    })
    setHasUnsavedChanges(false)
  }

  const closeNote = () => {
    if (hasUnsavedChanges) {
      saveNoteChanges()
    }
    setSelectedNote(null)
    setEditingNoteContent({ title: '', content: '', tags: '' })
    setHasUnsavedChanges(false)
  }

  const openGoal = (goal: Goal) => {
    if (hasUnsavedChanges) {
      saveNoteChanges()
    }
    if (hasUnsavedGoalChanges) {
      saveGoalChanges()
    }
    
    setSelectedGoal(goal)
    setSelectedNote(null) // Close note if open
    setEditingGoalContent({
      title: goal.title,
      description: goal.description || '',
      priority: goal.priority,
      due_date: goal.due_date || ''
    })
    setHasUnsavedGoalChanges(false)
  }

  const closeGoal = () => {
    if (hasUnsavedGoalChanges) {
      saveGoalChanges()
    }
    setSelectedGoal(null)
    setEditingGoalContent({ title: '', description: '', priority: 'medium', due_date: '' })
    setHasUnsavedGoalChanges(false)
  }

  const handleNoteContentChange = (field: 'title' | 'content' | 'tags', value: string) => {
    setEditingNoteContent(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleGoalContentChange = (field: 'title' | 'description' | 'priority' | 'due_date', value: string) => {
    setEditingGoalContent(prev => ({ ...prev, [field]: value }))
    setHasUnsavedGoalChanges(true)
  }

  const saveNoteChanges = async () => {
    if (!selectedNote || !editingNoteContent.title.trim() || isSaving) return
    
    setIsSaving(true)
    try {
      const tags = editingNoteContent.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      const { error } = await supabase
        .from('notes')
        .update({
          title: editingNoteContent.title.trim(),
          content: editingNoteContent.content.trim(),
          tags: tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id)
      
      if (error) throw error
      
      // Update the note in the local state
      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id 
          ? { ...note, title: editingNoteContent.title.trim(), content: editingNoteContent.content.trim(), tags }
          : note
      ))
      
      // Update selectedNote as well
      setSelectedNote(prev => prev ? {
        ...prev,
        title: editingNoteContent.title.trim(),
        content: editingNoteContent.content.trim(),
        tags
      } : null)
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveGoalChanges = async () => {
    if (!selectedGoal || !editingGoalContent.title.trim() || isSavingGoal) return
    
    setIsSavingGoal(true)
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          title: editingGoalContent.title.trim(),
          description: editingGoalContent.description.trim() || null,
          priority: editingGoalContent.priority,
          due_date: editingGoalContent.due_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedGoal.id)
      
      if (error) throw error
      
      // Update the goal in the local state
      setGoals(prev => prev.map(goal => 
        goal.id === selectedGoal.id 
          ? { 
              ...goal, 
              title: editingGoalContent.title.trim(), 
              description: editingGoalContent.description.trim() || null,
              priority: editingGoalContent.priority,
              due_date: editingGoalContent.due_date || null,
              updated_at: new Date().toISOString()
            } as Goal
          : goal
      ))
      
      // Update selectedGoal as well
      setSelectedGoal(prev => prev ? {
        ...prev,
        title: editingGoalContent.title.trim(),
        description: editingGoalContent.description.trim() || null,
        priority: editingGoalContent.priority,
        due_date: editingGoalContent.due_date || null,
        updated_at: new Date().toISOString()
      } as Goal : null)
      
      setHasUnsavedGoalChanges(false)
    } catch (error) {
      console.error('Error saving goal:', error)
    } finally {
      setIsSavingGoal(false)
    }
  }

  const createFolder = async () => {
    if (!user || !folderForm.name.trim()) return
    
    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: folderForm.name.trim(),
          color: folderForm.color,
        })
      
      if (error) throw error
      
      setFolderForm({ name: '', color: '#3B82F6' })
      setShowNewFolder(false)
      fetchData()
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const createNote = async () => {
    if (!user || !noteForm.title.trim()) return
    
    try {
      const tags = noteForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          folder_id: selectedFolder,
          title: noteForm.title.trim(),
          content: noteForm.content.trim(),
          tags: tags,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single()
      
      if (error) throw error
      
      setNoteForm({ title: '', content: '', tags: '' })
      setShowNewNote(false)
      fetchData()
      
      // Automatically open the new note
      if (data) {
        setTimeout(() => openNote(data), 100)
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
      
      if (error) throw error
      
      // Close note if it's currently open
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        setEditingNoteContent({ title: '', content: '', tags: '' })
        setHasUnsavedChanges(false)
      }
      
      fetchData()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const toggleNoteFavorite = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', note.id)
      
      if (error) throw error
      
      // Update local state
      setNotes(prev => prev.map(n => 
        n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
      ))
      
      // Update selectedNote if it's the same note
      if (selectedNote?.id === note.id) {
        setSelectedNote(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const archiveNote = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_archived: !note.is_archived })
        .eq('id', note.id)
      
      if (error) throw error
      
      // Close note if it's currently open and being archived
      if (selectedNote?.id === note.id && !note.is_archived) {
        setSelectedNote(null)
        setEditingNoteContent({ title: '', content: '', tags: '' })
        setHasUnsavedChanges(false)
      }
      
      fetchData()
    } catch (error) {
      console.error('Error archiving note:', error)
    }
  }

  const createGoal = async () => {
    if (!user || !goalForm.title.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          folder_id: selectedFolder,
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || null,
          priority: goalForm.priority,
          due_date: goalForm.due_date || null,
          is_completed: false,
        })
        .select()
        .single()
      
      if (error) throw error
      
      setGoalForm({ title: '', description: '', priority: 'medium', due_date: '' })
      setShowNewGoal(false)
      fetchData()
      
      // Automatically open the new goal
      if (data) {
        setTimeout(() => openGoal(data), 100)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const toggleGoalCompletion = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !goal.is_completed })
        .eq('id', goal.id)
      
      if (error) throw error
      
      // Update local state
      setGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, is_completed: !g.is_completed } : g
      ))
      
      // Update selectedGoal if it's the same goal
      if (selectedGoal?.id === goal.id) {
        setSelectedGoal(prev => prev ? { ...prev, is_completed: !prev.is_completed } : null)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
      
      if (error) throw error
      
      // Close goal if it's currently open
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null)
        setEditingGoalContent({ title: '', description: '', priority: 'medium', due_date: '' })
        setHasUnsavedGoalChanges(false)
      }
      
      fetchData()
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const filteredNotes = notes.filter(note => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesTitle = note.title.toLowerCase().includes(searchLower)
      const matchesContent = note.content.toLowerCase().includes(searchLower)
      const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      if (!matchesTitle && !matchesContent && !matchesTags) return false
    }
    
    // Folder filter
    if (selectedFolder && note.folder_id !== selectedFolder) return false
    
    // Type filter
    if (filter === 'favorites' && !note.is_favorite) return false
    if (filter === 'recent') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      if (new Date(note.updated_at) < threeDaysAgo) return false
    }
    
    return true
  })

  const filteredGoals = goals.filter(goal => {
    if (selectedFolder && goal.folder_id !== selectedFolder) return false
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      if (!goal.title.toLowerCase().includes(searchLower) && 
          !goal.description?.toLowerCase().includes(searchLower)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notes & Goals</h1>
            <p className="text-gray-600 mt-1">Organize your thoughts and track your goals</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Folder name"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2">
                      {folderColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setFolderForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            folderForm.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createFolder} className="flex-1">Create</Button>
                    <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Goal title"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={goalForm.description}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        value={goalForm.priority}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={goalForm.due_date}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createGoal} className="flex-1">Create</Button>
                    <Button variant="outline" onClick={() => setShowNewGoal(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Write your note..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px]"
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={noteForm.tags}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createNote} className="flex-1">Create</Button>
                    <Button variant="outline" onClick={() => setShowNewNote(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search notes and goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="w-full justify-start"
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    All Notes
                  </Button>
                  <Button
                    variant={filter === 'favorites' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('favorites')}
                    className="w-full justify-start"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Favorites
                  </Button>
                  <Button
                    variant={filter === 'recent' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('recent')}
                    className="w-full justify-start"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Recent
                  </Button>
                  <Button
                    variant={showArchived ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full justify-start"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archived
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Folders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderIcon className="w-5 h-5" />
                  Folders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedFolder === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedFolder(null)}
                  className="w-full justify-start"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  All Notes
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                    className="w-full justify-start"
                  >
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedNote ? (
              /* Note Editor View */
              <div className="space-y-4">
                {/* Note Editor Header */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={closeNote}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Notes
                  </Button>
                  <div className="flex items-center gap-2">
                    {isSaving && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Saving...
                      </div>
                    )}
                    {hasUnsavedChanges && !isSaving && (
                      <Button
                        onClick={saveNoteChanges}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNoteFavorite(selectedNote)}
                    >
                      <Star className={`w-4 h-4 ${selectedNote.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => archiveNote(selectedNote)}>
                          <Archive className="w-4 h-4 mr-2" />
                          {selectedNote.is_archived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteNote(selectedNote.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Note Editor */}
                <Card className="min-h-[600px]">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Title */}
                      <Input
                        value={editingNoteContent.title}
                        onChange={(e) => handleNoteContentChange('title', e.target.value)}
                        className="text-xl font-semibold border-none px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Note title..."
                      />
                      
                      {/* Tags */}
                      <Input
                        value={editingNoteContent.tags}
                        onChange={(e) => handleNoteContentChange('tags', e.target.value)}
                        placeholder="Tags (comma-separated)"
                        className="border-none px-0 py-1 text-sm text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      
                      {/* Content */}
                      <Textarea
                        value={editingNoteContent.content}
                        onChange={(e) => handleNoteContentChange('content', e.target.value)}
                        placeholder="Start writing your note..."
                        className="min-h-[400px] border-none px-0 py-2 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : selectedGoal ? (
              /* Goal Editor View */
              <div className="space-y-4">
                {/* Goal Editor Header */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={closeGoal}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Goals
                  </Button>
                  <div className="flex items-center gap-2">
                    {isSavingGoal && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Saving...
                      </div>
                    )}
                    {hasUnsavedGoalChanges && !isSavingGoal && (
                      <Button
                        onClick={saveGoalChanges}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGoalCompletion(selectedGoal)}
                    >
                      {selectedGoal.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => deleteGoal(selectedGoal.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Goal Editor */}
                <Card className="min-h-[600px]">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Title */}
                      <Input
                        value={editingGoalContent.title}
                        onChange={(e) => handleGoalContentChange('title', e.target.value)}
                        className="text-xl font-semibold border-none px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Goal title..."
                      />
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Textarea
                          value={editingGoalContent.description}
                          onChange={(e) => handleGoalContentChange('description', e.target.value)}
                          placeholder="Describe your goal in detail..."
                          className="min-h-[200px] resize-none"
                        />
                      </div>

                      {/* Priority and Due Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Priority</label>
                          <select
                            value={editingGoalContent.priority}
                            onChange={(e) => handleGoalContentChange('priority', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Due Date</label>
                          <Input
                            type="date"
                            value={editingGoalContent.due_date}
                            onChange={(e) => handleGoalContentChange('due_date', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Goal Status */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div 
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedGoal.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => toggleGoalCompletion(selectedGoal)}
                        >
                          {selectedGoal.is_completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                          <div>
                            <p className={`font-medium ${selectedGoal.is_completed ? 'text-green-800' : 'text-gray-900'}`}>
                              {selectedGoal.is_completed ? 'Completed' : 'In Progress'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Click to {selectedGoal.is_completed ? 'mark as incomplete' : 'mark as complete'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Notes Grid View */
              <div className="space-y-6">
                {/* Goals Section */}
                {filteredGoals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Goals & Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredGoals.map(goal => {
                          // Find the folder for this goal
                          const goalFolder = goal.folder_id ? folders.find(f => f.id === goal.folder_id) : null
                          
                          return (
                            <div
                              key={goal.id}
                              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                                goal.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                              }`}
                              onClick={() => openGoal(goal)}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleGoalCompletion(goal)
                                }}
                                className="mt-0.5 hover:scale-110 transition-transform"
                              >
                                {goal.is_completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className={`font-medium ${goal.is_completed ? 'line-through text-gray-500' : ''}`}>
                                      {goal.title}
                                    </h4>
                                    {goal.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                                    )}
                                    
                                    {/* Folder Badge - only show when viewing all notes */}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                                        {goal.priority}
                                      </Badge>
                                      {goal.due_date && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {format(new Date(goal.due_date), 'MMM dd')}
                                        </Badge>
                                      )}
                                      {!selectedFolder && goalFolder && (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs flex items-center gap-1"
                                          style={{ 
                                            borderColor: goalFolder.color,
                                            color: goalFolder.color
                                          }}
                                        >
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: goalFolder.color }}
                                          />
                                          {goalFolder.name}
                                        </Badge>
                                      )}
                                      {!selectedFolder && !goalFolder && (
                                        <Badge variant="outline" className="text-xs text-gray-500">
                                          No folder
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 w-8 p-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem 
                                          onClick={() => deleteGoal(goal.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNotes.map(note => {
                    // Find the folder for this note
                    const noteFolder = note.folder_id ? folders.find(f => f.id === note.folder_id) : null
                    
                    return (
                      <Card 
                        key={note.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openNote(note)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                              {/* Folder Badge - only show when viewing all notes */}
                              {!selectedFolder && noteFolder && (
                                <div className="mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs flex items-center gap-1 w-fit"
                                    style={{ 
                                      borderColor: noteFolder.color,
                                      color: noteFolder.color
                                    }}
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: noteFolder.color }}
                                    />
                                    {noteFolder.name}
                                  </Badge>
                                </div>
                              )}
                              {/* No folder badge for unorganized notes */}
                              {!selectedFolder && !noteFolder && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    No folder
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleNoteFavorite(note)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Star className={`w-4 h-4 ${note.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => archiveNote(note)}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    {note.is_archived ? 'Unarchive' : 'Archive'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteNote(note.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">{note.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{note.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {format(new Date(note.updated_at), 'MMM dd')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filteredNotes.length === 0 && filteredGoals.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes or goals found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchQuery || selectedFolder
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Start by creating your first note or goal.'}
                      </p>
                      {!searchQuery && !selectedFolder && (
                        <div className="flex gap-2 justify-center">
                          <Button onClick={() => setShowNewNote(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Note
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewGoal(true)}>
                            <Target className="w-4 h-4 mr-2" />
                            New Goal
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
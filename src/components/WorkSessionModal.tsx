import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Clock, Save, FileText, FolderOpen, Edit } from 'lucide-react'
import { WorkSessionData, TimeLog } from '@/services/supabase'

interface WorkSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: WorkSessionData) => void
  duration?: string
  loading?: boolean
  editSession?: TimeLog | null
  mode?: 'create' | 'edit'
}

export default function WorkSessionModal({
  isOpen,
  onClose,
  onSave,
  duration,
  loading = false,
  editSession = null,
  mode = 'create',
}: WorkSessionModalProps) {
  const [formData, setFormData] = useState<WorkSessionData>({
    title: '',
    project: '',
    description: '',
  })

  // Pre-populate form when editing
  useEffect(() => {
    if (mode === 'edit' && editSession) {
      setFormData({
        title: editSession.title || '',
        project: editSession.project || '',
        description: editSession.description || '',
      })
    } else if (mode === 'create') {
      setFormData({
        title: '',
        project: '',
        description: '',
      })
    }
  }, [mode, editSession, isOpen])

  const handleSave = () => {
    onSave(formData)
    // Reset form only if creating new session
    if (mode === 'create') {
      setFormData({
        title: '',
        project: '',
        description: '',
      })
    }
  }

  const handleCancel = () => {
    // Reset form and close
    if (mode === 'create') {
      setFormData({
        title: '',
        project: '',
        description: '',
      })
    } else {
      // Restore original data when editing
      setFormData({
        title: editSession?.title || '',
        project: editSession?.project || '',
        description: editSession?.description || '',
      })
    }
    onClose()
  }

  const getTitle = () => {
    if (mode === 'edit') {
      return 'Edit Work Session'
    }
    return 'Work Session Complete'
  }

  const getDescription = () => {
    if (mode === 'edit') {
      return 'Update the details of your work session.'
    }
    return `Great work! You've completed a ${duration} session. Add some details about what you accomplished.`
  }

  const getActionLabel = () => {
    if (mode === 'edit') {
      return loading ? 'Updating...' : 'Update Session'
    }
    return loading ? 'Saving...' : 'Save Session'
  }

  const getSkipLabel = () => {
    if (mode === 'edit') {
      return 'Cancel'
    }
    return 'Skip Details'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? (
              <Edit className="w-5 h-5 text-blue-600" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Session Title
            </Label>
            <Input
              id="title"
              placeholder="What did you work on? (e.g., 'Morning coding session')"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Project
            </Label>
            <Input
              id="project"
              placeholder="Which project? (e.g., 'Website redesign', 'Client work')"
              value={formData.project}
              onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="What specifically did you accomplish? Any notes or thoughts..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {getSkipLabel()}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {getActionLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
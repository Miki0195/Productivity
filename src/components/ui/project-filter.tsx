import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, X } from 'lucide-react'

interface ProjectFilterProps {
  projects: string[]
  selectedProject: string | null
  onProjectSelect: (project: string | null) => void
}

export default function ProjectFilter({
  projects,
  selectedProject,
  onProjectSelect,
}: ProjectFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Projects</span>
        {selectedProject && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onProjectSelect(null)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {selectedProject && (
        <div className="mb-2">
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <FolderOpen className="w-3 h-3" />
            {selectedProject}
            <button
              onClick={() => onProjectSelect(null)}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}
      
      {projects.length > 0 ? (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {projects.map((project) => (
            <Button
              key={project}
              variant={selectedProject === project ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onProjectSelect(project)}
              className="w-full justify-start text-left h-auto py-2 px-3"
            >
              <FolderOpen className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{project}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          {selectedProject 
            ? 'No other projects found'
            : 'No projects found for this period'
          }
        </div>
      )}
    </div>
  )
} 
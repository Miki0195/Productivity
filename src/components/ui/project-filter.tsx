import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, ChevronDown, X, Check } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)

  const handleProjectSelect = (project: string | null) => {
    onProjectSelect(project)
    setIsOpen(false)
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onProjectSelect(null)
  }

  return (
    <div className="relative">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Project Filter
        </label>
        
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-between h-10 px-3 text-left"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedProject ? (
                <>
                  <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{selectedProject}</span>
                  <button
                    onClick={clearSelection}
                    className="ml-auto flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">All Projects</span>
                </>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              <div className="p-1">
                {/* All Projects Option */}
                <button
                  onClick={() => handleProjectSelect(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-50 ${
                    !selectedProject ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {!selectedProject && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span>All Projects</span>
                  {!selectedProject && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </button>

                {/* Individual Projects */}
                {projects.length > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    {projects.map((project) => (
                      <button
                        key={project}
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-50 ${
                          selectedProject === project ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          {selectedProject === project && <Check className="w-3 h-3 text-blue-600" />}
                        </div>
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span className="truncate">{project}</span>
                      </button>
                    ))}
                  </div>
                )}

                {projects.length === 0 && (
                  <div className="px-3 py-6 text-center text-gray-500 text-sm">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No projects found</p>
                    <p className="text-xs mt-1">Start tracking time to see projects here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Indicator */}
        {selectedProject && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <FolderOpen className="w-3 h-3 mr-1" />
              {selectedProject}
            </Badge>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 
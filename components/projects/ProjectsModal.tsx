'use client'

import { useState, useEffect } from 'react'
import { supabase, type Project } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, FolderOpen, Trash2, Plus, X, Loader2, Calendar } from 'lucide-react'

interface ProjectsModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadProject: (projectData: any, projectId?: string, projectTitle?: string) => void
  currentProjectData: any
  user: any
}

export function ProjectsModal({ 
  isOpen, 
  onClose, 
  onLoadProject, 
  currentProjectData,
  user 
}: ProjectsModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      loadProjects()
    }
  }, [isOpen, user])

  const loadProjects = async () => {
    setLoading(true)
    setError('') // Clear any previous errors
    try {
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading projects:', error)
        throw error
      }
      
      
      setProjects(data || [])
    } catch (error: any) {
      console.error('Load projects error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async () => {
    if (!newProjectTitle.trim()) {
      setError('Project title is required')
      return
    }

    setSaving(true)
    setError('') // Clear any previous errors
    try {
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: newProjectTitle.trim(),
          description: newProjectDescription.trim() || null,
          canvas_data: currentProjectData,
        })
        .select()

      if (error) {
        console.error('Error saving project:', error)
        throw error
      }
      
      
      setNewProjectTitle('')
      setNewProjectDescription('')
      setShowSaveForm(false)
      
      // Reload projects to show the new one
      await loadProjects()
    } catch (error: any) {
      console.error('Save project error:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      loadProjects()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const loadProject = (project: Project) => {
    try {
      onLoadProject(project.canvas_data, project.id, project.title)
      onClose()
    } catch (error) {
      console.error('Error loading project:', error)
      setError('Failed to load project: ' + (error as Error).message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Projects
          </CardTitle>
          <CardDescription>
            Save your current drawing or load a previous project
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Save Current Project */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Save Current Project</h3>
              <Button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Project
              </Button>
            </div>
            
            {showSaveForm && (
              <div className="space-y-4 mt-4 p-4 bg-white rounded-md border">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Enter project title..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description..."
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveProject}
                    disabled={saving || !newProjectTitle.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveForm(false)
                      setNewProjectTitle('')
                      setNewProjectDescription('')
                      setError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Projects List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Projects</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No projects saved yet</p>
                <p className="text-sm">Save your first project to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                          {project.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProject(project.id)
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                        <Button
                          onClick={() => loadProject(project)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

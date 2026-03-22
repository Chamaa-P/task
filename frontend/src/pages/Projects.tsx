import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Users, CheckSquare, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

interface Assignee {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: number;
  assignedTo?: number;
  dueDate?: string;
  assignee?: Assignee;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  tasks?: Task[];
}

interface CreateProjectPayload {
  name: string;
  description: string;
  color: string;
}

interface CreateTaskPayload {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectId: number;
  assignedTo: number;
}

interface CreateAssigneePayload {
  name: string;
}

const PROJECT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6'];

export default function Projects() {
  const queryClient = useQueryClient();
  const [projectForm, setProjectForm] = useState<CreateProjectPayload>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });
  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
  });
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [newAssigneeForm, setNewAssigneeForm] = useState<CreateAssigneePayload>({
    name: '',
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data.projects;
    },
  });

  const { data: assignees = [], isLoading: assigneesLoading } = useQuery<Assignee[]>({
    queryKey: ['assignees'],
    queryFn: async () => {
      const response = await apiClient.get('/assignees');
      return response.data.assignees;
    },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const response = await apiClient.post('/projects', payload);
      return response.data.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectForm({ name: '', description: '', color: PROJECT_COLORS[0] });
      toast.success('Project created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create project');
    },
  });

  const assignTasksMutation = useMutation({
    mutationFn: async (payload: CreateTaskPayload[]) => {
      await Promise.all(payload.map((item) => apiClient.post('/tasks', item)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setTaskForm({
        projectId: '',
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
      });
      setSelectedAssignees([]);
      toast.success('Tasks assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign tasks');
    },
  });

  const createAssigneeMutation = useMutation({
    mutationFn: async (payload: CreateAssigneePayload) => {
      const response = await apiClient.post('/assignees', payload);
      return response.data.assignee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignees'] });
      setNewAssigneeForm({
        name: '',
      });
      toast.success('Assignee added to the list');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create assignee');
    },
  });

  const tasksByProject = useMemo(() => {
    return tasks.reduce<Record<number, Task[]>>((accumulator, task) => {
      if (!task.projectId) {
        return accumulator;
      }

      if (!accumulator[task.projectId]) {
        accumulator[task.projectId] = [];
      }

      accumulator[task.projectId].push(task);
      return accumulator;
    }, {});
  }, [tasks]);

  const handleProjectSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    createProjectMutation.mutate({
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      color: projectForm.color,
    });
  };

  const handleTaskAssignmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taskForm.projectId) {
      toast.error('Please choose a project');
      return;
    }

    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (selectedAssignees.length === 0) {
      toast.error('Select at least one assignee');
      return;
    }

    const payload: CreateTaskPayload[] = selectedAssignees.map((assigneeId) => ({
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority: taskForm.priority,
      projectId: Number(taskForm.projectId),
      assignedTo: assigneeId,
      dueDate: taskForm.dueDate || undefined,
    }));

    assignTasksMutation.mutate(payload);
  };

  const toggleAssignee = (assigneeId: number) => {
    setSelectedAssignees((current) => {
      if (current.includes(assigneeId)) {
        return current.filter((id) => id !== assigneeId);
      }
      return [...current, assigneeId];
    });
  };

  const handleCreateAssigneeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newAssigneeForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    createAssigneeMutation.mutate({
      name: newAssigneeForm.name.trim(),
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">
          Create projects and assign the same task to several users in one action.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <form onSubmit={handleProjectSubmit} className="card space-y-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              className="input"
              placeholder="e.g. Mobile App Redesign"
              value={projectForm.name}
              onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input min-h-[88px]"
              placeholder="Project objective and scope"
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({ ...projectForm, description: event.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setProjectForm({ ...projectForm, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    projectForm.color === color ? 'border-gray-900' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createProjectMutation.isPending}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </form>

        <form onSubmit={handleTaskAssignmentSubmit} className="card space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Assign Task to Multiple People</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              className="input"
              value={taskForm.projectId}
              onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              className="input"
              placeholder="e.g. Draft sprint requirements"
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
            <textarea
              className="input min-h-[72px]"
              placeholder="Details and expected output"
              value={taskForm.description}
              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="input"
                value={taskForm.priority}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    priority: event.target.value as 'low' | 'medium' | 'high' | 'urgent',
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (day only)</label>
              <input
                type="date"
                className="input"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2 bg-gray-50">
              {assignees.map((assignee) => {
                const checked = selectedAssignees.includes(assignee.id);
                return (
                  <label
                    key={assignee.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssignee(assignee.id)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{assignee.name}</p>
                    </div>
                  </label>
                );
              })}
              {assignees.length === 0 && <p className="text-sm text-gray-500 p-2">No assignees found. Add one below.</p>}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: <span className="font-medium">{selectedAssignees.length}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={assignTasksMutation.isPending}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {assignTasksMutation.isPending ? 'Assigning...' : 'Assign Tasks'}
          </button>
        </form>
      </div>

      <div className="card mb-8">
        <form onSubmit={handleCreateAssigneeSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Add Person for Task Assignment</h2>
          </div>
          <p className="text-sm text-gray-600">
            Add people by name so they appear in the Assign To list above.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="input"
                value={newAssigneeForm.name}
                onChange={(event) =>
                  setNewAssigneeForm({ ...newAssigneeForm, name: event.target.value })
                }
                placeholder="e.g. Jordan Smith"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createAssigneeMutation.isPending}
            className="btn btn-primary disabled:opacity-50"
          >
            {createAssigneeMutation.isPending ? 'Adding...' : 'Add Person'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Projects and Assigned Tasks</h2>
          </div>
          <p className="text-sm text-gray-600">{projects.length} projects</p>
        </div>

        {projectsLoading || assigneesLoading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects yet. Create your first project above.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const projectTasks = tasksByProject[project.id] || [];

              return (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className="text-xs text-gray-500">{projectTasks.length} tasks</span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  )}

                  {projectTasks.length > 0 ? (
                    <div className="space-y-2">
                      {projectTasks.slice(0, 6).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-600">
                              {task.assignee?.name
                                ? `Assigned to ${task.assignee.name}`
                                : 'Unassigned'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tasks assigned for this project yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

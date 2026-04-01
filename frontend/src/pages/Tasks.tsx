import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Filter, Calendar, User, AlertCircle, Trash2 } from 'lucide-react';
import apiClient from '../lib/api';
import { formatDueDate, isDueDateOverdue } from '../lib/dates';

interface Assignee {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  color?: string;
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
  project?: Project;
}

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  archived: 'bg-slate-100 text-slate-500 border-slate-300',
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await apiClient.put(`/tasks/${taskId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleDeleteTask = (taskId: number) => {
    const confirmed = window.confirm('Delete this task? This action cannot be undone.');
    if (!confirmed) return;
    deleteTaskMutation.mutate(taskId);
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    completed: filteredTasks.filter((t) => t.status === 'completed'),
    archived: filteredTasks.filter((t) => t.status === 'archived'),
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tasks Dashboard</h1>
        <p className="text-gray-600 mt-2">View all tasks with assignees, priorities, and due dates</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span>Total Tasks: <strong>{filteredTasks.length}</strong></span>
          <span>To Do: <strong>{tasksByStatus.todo.length}</strong></span>
          <span>In Progress: <strong>{tasksByStatus.in_progress.length}</strong></span>
          <span>Completed: <strong>{tasksByStatus.completed.length}</strong></span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">All Tasks</h2>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-500">No tasks found. Create tasks in the Projects page.</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isOverdue = isDueDateOverdue(task.dueDate, task.status);

              return (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    STATUS_COLORS[task.status]
                  } border`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                        {task.project && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: task.project.color || '#3B82F6' }}
                          >
                            {task.project.name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* Assignee */}
                        <div className="flex items-center gap-1.5">
                          <User size={16} className="text-gray-500" />
                          <span className="text-gray-700 font-medium">
                            {task.assignee?.name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-1.5">
                          <Calendar size={16} className={isOverdue ? 'text-red-600' : 'text-gray-500'} />
                          {task.dueDate ? (
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {formatDueDate(task.dueDate)}
                              {isOverdue && (
                                <span className="ml-1 inline-flex items-center">
                                  <AlertCircle size={14} className="inline ml-0.5" />
                                  <span className="ml-0.5">Overdue</span>
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">No due date</span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border">
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>

                        {/* Status Change Dropdown */}
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="px-2.5 py-1 text-xs font-medium border rounded bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={updateTaskStatusMutation.isPending || deleteTaskMutation.isPending}
                          >
                            <option value="todo">TO DO</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="completed">COMPLETED</option>
                            <option value="archived">ARCHIVED</option>
                          </select>

                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deleteTaskMutation.isPending || updateTaskStatusMutation.isPending}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${
                          PRIORITY_COLORS[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { CheckSquare, FolderKanban, Clock, TrendingUp } from 'lucide-react';
import apiClient from '../lib/api';

export default function Dashboard() {
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data.projects;
    },
  });

  const stats = [
    {
      icon: CheckSquare,
      label: 'Total Tasks',
      value: tasks?.length || 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: FolderKanban,
      label: 'Projects',
      value: projects?.length || 0,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Clock,
      label: 'In Progress',
      value: tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: TrendingUp,
      label: 'Completed',
      value: tasks?.filter((t: any) => t.status === 'completed').length || 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      {task.status.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
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
            <p className="text-gray-500">No tasks yet. Create your first task!</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Projects</h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project: any) => (
                <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">
                        {project.tasks?.length || 0} tasks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No projects yet. Create your first project!</p>
          )}
        </div>
      </div>
    </div>
  );
}

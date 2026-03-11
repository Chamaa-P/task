import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks, projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full" />
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username}
              </p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

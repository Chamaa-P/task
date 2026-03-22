import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CalendarDays, FolderKanban } from 'lucide-react';
import apiClient from '../lib/api';
import { getDateKey, parseDueDate } from '../lib/dates';

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
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: number;
  project?: Project;
  assignee?: Assignee;
}

interface CalendarItem {
  task: Task;
  dueDate: Date;
  projectColor: string;
  projectName: string;
}

interface ProjectDueGroup {
  projectKey: string;
  projectName: string;
  projectColor: string;
  tasks: Task[];
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

function addDays(date: Date, amount: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function isToday(date: Date): boolean {
  return getDateKey(new Date()) === getDateKey(date);
}

function buildMonthGrid(anchorDate: Date): Date[] {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export default function Calendar() {
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects');
      return response.data.projects;
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    },
  });

  const projectById = useMemo(() => {
    return projects.reduce<Record<number, Project>>((accumulator, project) => {
      accumulator[project.id] = project;
      return accumulator;
    }, {});
  }, [projects]);

  const calendarItems = useMemo<CalendarItem[]>(() => {
    return tasks
      .map((task) => {
        const dueDate = parseDueDate(task.dueDate);
        if (!dueDate) {
          return null;
        }

        const project = task.projectId ? projectById[task.projectId] : undefined;

        return {
          task,
          dueDate,
          projectColor: project?.color || task.project?.color || '#3B82F6',
          projectName: project?.name || task.project?.name || 'General',
        };
      })
      .filter((item): item is CalendarItem => item !== null)
      .sort((left, right) => {
        if (left.dueDate.getTime() !== right.dueDate.getTime()) {
          return left.dueDate.getTime() - right.dueDate.getTime();
        }

        if (left.projectName !== right.projectName) {
          return left.projectName.localeCompare(right.projectName);
        }

        if (PRIORITY_ORDER[left.task.priority] !== PRIORITY_ORDER[right.task.priority]) {
          return PRIORITY_ORDER[left.task.priority] - PRIORITY_ORDER[right.task.priority];
        }

        return left.task.title.localeCompare(right.task.title);
      });
  }, [tasks, projectById]);

  const calendarDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const groupsByDate = useMemo(() => {
    const grouped: Record<string, ProjectDueGroup[]> = {};

    for (const item of calendarItems) {
      const dateKey = getDateKey(item.dueDate);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      let projectGroup = grouped[dateKey].find(
        (group) => group.projectKey === `${item.task.projectId || 'general'}-${item.projectName}`
      );

      if (!projectGroup) {
        projectGroup = {
          projectKey: `${item.task.projectId || 'general'}-${item.projectName}`,
          projectName: item.projectName,
          projectColor: item.projectColor,
          tasks: [],
        };
        grouped[dateKey].push(projectGroup);
      }

      projectGroup.tasks.push(item.task);
    }

    for (const dateKey of Object.keys(grouped)) {
      grouped[dateKey].sort((left, right) => left.projectName.localeCompare(right.projectName));
      grouped[dateKey].forEach((group) => {
        group.tasks.sort((left, right) => {
          if (PRIORITY_ORDER[left.priority] !== PRIORITY_ORDER[right.priority]) {
            return PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
          }

          return left.title.localeCompare(right.title);
        });
      });
    }

    return grouped;
  }, [calendarItems]);

  const visibleMonthItems = useMemo(() => {
    return calendarItems.filter((item) => isSameMonth(item.dueDate, visibleMonth));
  }, [calendarItems, visibleMonth]);

  const visibleMonthProjectCount = useMemo(() => {
    return new Set(visibleMonthItems.map((item) => item.projectName)).size;
  }, [visibleMonthItems]);

  const busiestDateLabel = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of visibleMonthItems) {
      const dateKey = getDateKey(item.dueDate);
      counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
    }

    let busiestDate: string | null = null;
    let busiestCount = 0;

    for (const [dateKey, count] of counts.entries()) {
      if (count > busiestCount) {
        busiestDate = dateKey;
        busiestCount = count;
      }
    }

    if (!busiestDate) {
      return 'No due dates this month';
    }

    const [year, month, day] = busiestDate.split('-').map(Number);
    const displayDate = new Date(year, month - 1, day);

    return `${displayDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} (${busiestCount} due)`;
  }, [visibleMonthItems]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Due Date Calendar</h1>
          <p className="mt-2 text-gray-600">
            View deadlines by day, with every due project grouped clearly on the calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            className="btn btn-secondary flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Prev Month
          </button>
          <button
            onClick={() =>
              setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
            }
            className="btn btn-secondary"
          >
            Today
          </button>
          <button
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            className="btn btn-secondary flex items-center gap-1"
          >
            Next Month
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <CalendarDays size={18} className="text-primary-600" />
            <span>{monthLabelFormatter.format(visibleMonth)}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-700">
              {visibleMonthItems.length} due {visibleMonthItems.length === 1 ? 'task' : 'tasks'}
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <FolderKanban size={14} className="mr-1.5 inline" />
              {visibleMonthProjectCount} {visibleMonthProjectCount === 1 ? 'project' : 'projects'}
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
              Busiest day: {busiestDateLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {tasksLoading || projectsLoading ? (
          <p className="text-gray-500">Loading calendar...</p>
        ) : (
          <div className="min-w-[980px]">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayGroups = groupsByDate[getDateKey(day)] || [];
                const dueTaskCount = dayGroups.reduce((sum, group) => sum + group.tasks.length, 0);
                const inVisibleMonth = isSameMonth(day, visibleMonth);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[220px] border-b border-r border-gray-200 p-3 ${
                      index % 7 === 0 ? 'border-l' : ''
                    } ${inVisibleMonth ? 'bg-white' : 'bg-gray-50/80'}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                            inVisibleMonth ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isToday(day)
                              ? 'text-primary-700'
                              : inVisibleMonth
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {day.getDate()}
                        </p>
                      </div>

                      {dueTaskCount > 0 && (
                        <div className="rounded-full bg-primary-50 px-2.5 py-1 text-right">
                          <p className="text-xs font-semibold text-primary-700">{dueTaskCount} due</p>
                          <p className="text-[11px] text-primary-600">
                            {dayGroups.length} {dayGroups.length === 1 ? 'project' : 'projects'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="max-h-[145px] space-y-2 overflow-y-auto pr-1">
                      {dayGroups.length === 0 ? (
                        <p className={`text-xs ${inVisibleMonth ? 'text-gray-400' : 'text-gray-300'}`}>
                          No due items
                        </p>
                      ) : (
                        dayGroups.map((group) => (
                          <div
                            key={group.projectKey}
                            className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: group.projectColor }}
                              />
                              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-900">
                                {group.projectName}
                              </p>
                              <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                {group.tasks.length}
                              </span>
                            </div>

                            {group.tasks.slice(0, 2).map((task) => (
                              <p key={task.id} className="truncate text-[11px] text-gray-600">
                                {task.title}
                                {task.assignee?.name ? ` • ${task.assignee.name}` : ''}
                              </p>
                            ))}

                            {group.tasks.length > 2 && (
                              <p className="text-[11px] font-medium text-primary-700">
                                +{group.tasks.length - 2} more due
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

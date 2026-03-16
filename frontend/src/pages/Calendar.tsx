import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import apiClient from '../lib/api';

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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: number;
  project?: Project;
  assignee?: Assignee;
}

interface CalendarSegment {
  task: Task;
  dayIndex: number;
  top: number;
  height: number;
  startTime: string;
  endTime: string;
  projectColor: string;
  projectName: string;
}

const WEEK_STARTS_ON = 1;
const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 64;
const TASK_START_HOUR = 20; // 8pm
const TASK_DURATION_HOURS = 1.5; // 1.5 hours (until 9:30pm)

export default function Calendar() {
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
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

  const weekDays = useMemo(() => {
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: weekStartDate, end: weekEndDate });
  }, [weekStartDate]);

  const projectById = useMemo(() => {
    return projects.reduce<Record<number, Project>>((accumulator, project) => {
      accumulator[project.id] = project;
      return accumulator;
    }, {});
  }, [projects]);

  const hourLabels = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => {
      const hour = START_HOUR + index;
      const date = new Date();
      date.setHours(hour, 0, 0, 0);
      return format(date, 'haaa').toLowerCase();
    });
  }, []);

  const scheduledSegments = useMemo<CalendarSegment[]>(() => {
    return tasks
      .filter((task) => task.dueDate)
      .flatMap((task) => {
        const dueDate = parseISO(task.dueDate!);

        if (Number.isNaN(dueDate.getTime())) {
          return [];
        }

        // Find which day of the week this task belongs to
        const dayIndex = weekDays.findIndex((day) => isSameDay(day, dueDate));
        
        // If the due date is not in this week, skip it
        if (dayIndex === -1) {
          return [];
        }

        // Calculate position: task starts at 8pm (20:00)
        const minutesFromGridStart = (TASK_START_HOUR - START_HOUR) * 60;
        const durationMinutes = TASK_DURATION_HOURS * 60;

        const top = (minutesFromGridStart / 60) * HOUR_HEIGHT;
        const height = (durationMinutes / 60) * HOUR_HEIGHT;

        const project = task.projectId ? projectById[task.projectId] : undefined;
        
        // Calculate display times
        const startHour = TASK_START_HOUR;
        const endHour = TASK_START_HOUR + Math.floor(TASK_DURATION_HOURS);
        const endMinutes = (TASK_DURATION_HOURS % 1) * 60;
        const startTime = `${startHour}:00`;
        const endTime = `${endHour}:${endMinutes.toString().padStart(2, '0')}`;

        return [
          {
            task,
            dayIndex,
            top,
            height,
            startTime,
            endTime,
            projectColor: project?.color || task.project?.color || '#3B82F6',
            projectName: project?.name || task.project?.name || 'General',
          },
        ];
      });
  }, [tasks, weekDays, projectById]);

  const weekTitle = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
  const totalCalendarHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <div>
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Calendar</h1>
          <p className="text-gray-600 mt-2">View tasks on their due dates (scheduled at 8:00 PM - 9:30 PM)</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStartDate((current) => subWeeks(current, 1))}
            className="btn btn-secondary flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Prev Week
          </button>
          <button
            onClick={() =>
              setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }))
            }
            className="btn btn-secondary"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStartDate((current) => addWeeks(current, 1))}
            className="btn btn-secondary flex items-center gap-1"
          >
            Next Week
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <CalendarDays size={18} className="text-primary-600" />
          <span>{weekTitle}</span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {tasksLoading || projectsLoading ? (
          <p className="text-gray-500">Loading calendar...</p>
        ) : (
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))] border-b border-gray-200">
              <div className="p-3 text-xs font-medium text-gray-500">Time</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-3 border-l border-gray-200">
                  <p className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</p>
                  <p className="text-sm font-semibold text-gray-900">{format(day, 'MMM d')}</p>
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))]"
              style={{ height: `${totalCalendarHeight}px` }}
            >
              <div className="relative border-r border-gray-200 bg-gray-50">
                {hourLabels.map((label, index) => (
                  <div
                    key={label}
                    className="absolute left-0 right-0 -translate-y-1/2 px-2 text-[11px] text-gray-500"
                    style={{ top: `${index * HOUR_HEIGHT}px` }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {weekDays.map((day, dayIndex) => (
                <div key={day.toISOString()} className="relative border-l border-gray-200">
                  {hourLabels.map((_, hourIndex) => (
                    <div
                      key={hourIndex}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: `${hourIndex * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {scheduledSegments
                    .filter((segment) => segment.dayIndex === dayIndex)
                    .map((segment) => (
                      <div
                        key={`${segment.task.id}-${segment.dayIndex}`}
                        className="absolute left-1 right-1 rounded-md p-2 text-white shadow-sm overflow-hidden"
                        style={{
                          top: `${segment.top}px`,
                          height: `${segment.height}px`,
                          backgroundColor: segment.projectColor,
                        }}
                      >
                        <p className="text-xs font-semibold truncate">{segment.task.title}</p>
                        <p className="text-[11px] opacity-90 truncate">
                          {segment.startTime} - {segment.endTime}
                        </p>
                        <p className="text-[11px] opacity-90 truncate">{segment.projectName}</p>
                        {segment.task.assignee?.name && (
                          <p className="text-[11px] opacity-90 truncate">
                            {segment.task.assignee.name}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

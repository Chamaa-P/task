import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addWeeks,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isWithinInterval,
  max,
  min,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import apiClient from '../lib/api';

interface User {
  id: number;
  username: string;
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
  startTime?: string;
  endTime?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: number;
  project?: Project;
  assignee?: User;
}

interface CalendarSegment {
  task: Task;
  dayIndex: number;
  top: number;
  height: number;
  segmentStart: Date;
  segmentEnd: Date;
  projectColor: string;
  projectName: string;
}

const WEEK_STARTS_ON = 1;
const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 64;

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
    const weekEndDate = addDays(weekStartDate, 7);

    return tasks
      .filter((task) => task.startTime && task.endTime)
      .flatMap((task) => {
        const taskStart = parseISO(task.startTime!);
        const taskEnd = parseISO(task.endTime!);

        if (Number.isNaN(taskStart.getTime()) || Number.isNaN(taskEnd.getTime())) {
          return [];
        }

        if (taskEnd <= taskStart) {
          return [];
        }

        if (
          !isWithinInterval(taskStart, {
            start: subWeeks(weekStartDate, 1),
            end: addWeeks(weekEndDate, 1),
          }) &&
          !isWithinInterval(taskEnd, {
            start: weekStartDate,
            end: weekEndDate,
          })
        ) {
          return [];
        }

        return weekDays.flatMap((day, dayIndex) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);

          const segmentStart = max([taskStart, dayStart]);
          const segmentEnd = min([taskEnd, dayEnd]);

          if (segmentEnd <= segmentStart) {
            return [];
          }

          const minutesFromGridStart =
            (segmentStart.getHours() - START_HOUR) * 60 + segmentStart.getMinutes();
          const durationMinutes = differenceInMinutes(segmentEnd, segmentStart);

          const top = Math.max(0, (minutesFromGridStart / 60) * HOUR_HEIGHT);
          const height = Math.max(24, (durationMinutes / 60) * HOUR_HEIGHT);
          const project = task.projectId ? projectById[task.projectId] : undefined;

          return [
            {
              task,
              dayIndex,
              top,
              height,
              segmentStart,
              segmentEnd,
              projectColor: project?.color || task.project?.color || '#3B82F6',
              projectName: project?.name || task.project?.name || 'General',
            },
          ];
        });
      })
      .filter((segment) => segment.top < (END_HOUR - START_HOUR) * HOUR_HEIGHT);
  }, [tasks, weekStartDate, weekDays, projectById]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((task) => !task.startTime || !task.endTime);
  }, [tasks]);

  const weekTitle = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
  const totalCalendarHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <div>
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Calendar</h1>
          <p className="text-gray-600 mt-2">Browse any week and view tasks in exact time slots.</p>
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
                        key={`${segment.task.id}-${segment.segmentStart.toISOString()}-${segment.dayIndex}`}
                        className="absolute left-1 right-1 rounded-md p-2 text-white shadow-sm overflow-hidden"
                        style={{
                          top: `${segment.top}px`,
                          height: `${segment.height}px`,
                          backgroundColor: segment.projectColor,
                        }}
                      >
                        <p className="text-xs font-semibold truncate">{segment.task.title}</p>
                        <p className="text-[11px] opacity-90 truncate">
                          {format(segment.segmentStart, 'HH:mm')} - {format(segment.segmentEnd, 'HH:mm')}
                        </p>
                        <p className="text-[11px] opacity-90 truncate">{segment.projectName}</p>
                        {segment.task.assignee?.username && (
                          <p className="text-[11px] opacity-90 truncate">
                            {segment.task.assignee.username}
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

      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Unscheduled Tasks</h2>
        {unscheduledTasks.length === 0 ? (
          <p className="text-sm text-gray-500">All current tasks have start and end times.</p>
        ) : (
          <div className="space-y-2">
            {unscheduledTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-600">{task.project?.name || 'No project'}</p>
                </div>
                <span className="text-xs text-gray-500">Missing start/end time</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

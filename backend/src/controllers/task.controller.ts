import { Response } from 'express';
import { Task, User, Project, Assignee } from '../models';
import { AuthRequest } from '../middleware/auth';
import { TaskStatus, TaskPriority } from '../models/Task';
import {
  emitTaskCreated,
  emitTaskDeleted,
  emitTaskUpdated,
} from '../websocket/socketHandler';

const normalizeDueDate = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const fallback = new Date(value);

  if (Number.isNaN(fallback.getTime())) {
    return undefined;
  }

  return fallback.toISOString().slice(0, 10);
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assignedTo,
      dueDate,
      estimatedHours,
      tags,
    } = req.body;

    const normalizedDueDate = normalizeDueDate(dueDate);

    if (dueDate !== undefined && normalizedDueDate === undefined) {
      res.status(400).json({ error: 'Invalid due date format' });
      return;
    }

    const task = await Task.create({
      title,
      description,
      status: status || TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      projectId,
      assignedTo,
      createdBy: req.user!.id,
      dueDate: normalizedDueDate,
      estimatedHours,
      tags,
    });

    // Fetch task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: Assignee, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project' },
      ],
    });

    emitTaskCreated({
      task: createdTask,
      actorUserId: req.user!.id,
      projectId: createdTask?.projectId ?? null,
    });

    res.status(201).json({ task: createdTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, projectId, assignedTo } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: Assignee, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: Assignee, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project' },
      ],
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.prototype.hasOwnProperty.call(updates, 'dueDate')) {
      const normalizedDueDate = normalizeDueDate(updates.dueDate);

      if (updates.dueDate !== undefined && normalizedDueDate === undefined) {
        res.status(400).json({ error: 'Invalid due date format' });
        return;
      }

      updates.dueDate = normalizedDueDate;
    }

    const task = await Task.findByPk(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await task.update(updates);

    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: Assignee, as: 'assignee', attributes: ['id', 'name'] },
        { model: Project, as: 'project' },
      ],
    });

    emitTaskUpdated({
      task: updatedTask,
      actorUserId: req.user!.id,
      projectId: updatedTask?.projectId ?? null,
    });

    res.status(200).json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const deletedTaskId = task.id;
    const deletedProjectId = task.projectId ?? null;

    await task.destroy();

    emitTaskDeleted({
      taskId: deletedTaskId,
      actorUserId: req.user!.id,
      projectId: deletedProjectId,
    });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

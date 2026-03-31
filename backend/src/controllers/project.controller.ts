import { Response } from 'express';
import { Project, User, Task } from '../models';
import { AuthRequest } from '../middleware/auth';
import { emitProjectCreated, emitProjectDeleted, emitProjectUpdated } from '../websocket/socketHandler';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      ownerId: req.user!.id,
    });

    const createdProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }],
    });

    emitProjectCreated({
      projectId: project.id,
      actorUserId: req.user!.id,
    });

    res.status(201).json({ project: createdProject });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email'] },
        { model: Task, as: 'tasks' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email'] },
        {
          model: Task,
          as: 'tasks',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
            { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] },
          ],
        },
      ],
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.status(200).json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check if user is owner
    if (project.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to update this project' });
      return;
    }

    await project.update(updates);

    const updatedProject = await Project.findByPk(id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }],
    });

    emitProjectUpdated({
      projectId: updatedProject?.id ?? null,
      actorUserId: req.user!.id,
    });

    res.status(200).json({ project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check if user is owner
    if (project.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to delete this project' });
      return;
    }

    await project.destroy();

    emitProjectDeleted({
      projectId: project.id,
      actorUserId: req.user!.id,
    });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
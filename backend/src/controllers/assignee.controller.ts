import { Request, Response } from 'express';
import Assignee from '../models/Assignee';

export const createAssignee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || String(name).trim().length === 0) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const trimmedName = String(name).trim();

    // Check if assignee with same name already exists
    const existing = await Assignee.findOne({ where: { name: trimmedName } });
    if (existing) {
      res.status(400).json({ error: 'Assignee with this name already exists' });
      return;
    }

    const assignee = await Assignee.create({ name: trimmedName });

    res.status(201).json({
      message: 'Assignee created successfully',
      assignee: {
        id: assignee.id,
        name: assignee.name,
      },
    });
  } catch (error) {
    console.error('Create assignee error:', error);
    res.status(500).json({ error: 'Failed to create assignee' });
  }
};

export const getAssignees = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignees = await Assignee.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({ assignees });
  } catch (error) {
    console.error('Get assignees error:', error);
    res.status(500).json({ error: 'Failed to fetch assignees' });
  }
};

export const getAssigneeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignee = await Assignee.findByPk(id);

    if (!assignee) {
      res.status(404).json({ error: 'Assignee not found' });
      return;
    }

    res.status(200).json({ assignee });
  } catch (error) {
    console.error('Get assignee error:', error);
    res.status(500).json({ error: 'Failed to fetch assignee' });
  }
};

export const deleteAssignee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignee = await Assignee.findByPk(id);

    if (!assignee) {
      res.status(404).json({ error: 'Assignee not found' });
      return;
    }

    await assignee.destroy();

    res.status(200).json({ message: 'Assignee deleted successfully' });
  } catch (error) {
    console.error('Delete assignee error:', error);
    res.status(500).json({ error: 'Failed to delete assignee' });
  }
};

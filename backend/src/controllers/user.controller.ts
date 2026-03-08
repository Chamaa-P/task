import { Request, Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const createUserByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || String(username).trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (!email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    const existingByEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingByEmail) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    const existingByUsername = await User.findOne({ where: { username: normalizedUsername } });
    if (existingByUsername) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: String(password),
      firstName: firstName ? String(firstName).trim() : undefined,
      lastName: lastName ? String(lastName).trim() : undefined,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Create user by admin error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Users can only update their own profile
    if (parseInt(id) !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to update this user' });
      return;
    }

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Don't allow updating email or username through this endpoint
    delete updates.email;
    delete updates.username;
    delete updates.password;

    await user.update(updates);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
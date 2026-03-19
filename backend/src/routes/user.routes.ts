import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createUserByAdmin, getUsers, getUserById, updateUser } from '../controllers/user.controller';

// User management routes, including admin-only user creation and authenticated user retrieval and updates

const router = Router();

router.post('/admin-create', createUserByAdmin);

// All routes require authentication
router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
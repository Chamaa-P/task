import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAssignee,
  getAssignees,
  getAssigneeById,
  deleteAssignee,
} from '../controllers/assignee.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createAssignee);
router.get('/', getAssignees);
router.get('/:id', getAssigneeById);
router.delete('/:id', deleteAssignee);

export default router;

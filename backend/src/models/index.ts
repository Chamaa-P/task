import User from './User';
import Project from './Project';
import Task from './Task';
import Assignee from './Assignee';

// Define associations
User.hasMany(Project, {
  foreignKey: 'ownerId',
  as: 'ownedProjects',
});

Project.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

User.hasMany(Task, {
  foreignKey: 'createdBy',
  as: 'createdTasks',
});

Assignee.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks',
});

Task.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

Task.belongsTo(Assignee, {
  foreignKey: 'assignedTo',
  as: 'assignee',
});

Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
});

Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

export { User, Project, Task, Assignee };
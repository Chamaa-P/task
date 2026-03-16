import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface AssigneeAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AssigneeCreationAttributes extends Optional<AssigneeAttributes, 'id'> {}

class Assignee extends Model<AssigneeAttributes, AssigneeCreationAttributes> implements AssigneeAttributes {
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Assignee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
  },
  {
    sequelize,
    tableName: 'assignees',
    timestamps: true,
  }
);

export default Assignee;

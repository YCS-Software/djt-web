/**
 * Role Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(100),
      field: 'display_name',
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      field: 'is_system',
      defaultValue: false,
    },
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  });

  return Role;
};

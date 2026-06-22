/**
 * Permission Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(150),
      field: 'display_name',
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return Permission;
};

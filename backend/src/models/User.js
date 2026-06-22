/**
 * User Model
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    partnerId: {
      type: DataTypes.UUID,
      field: 'partner_id',
      allowNull: true,
      references: {
        model: 'partners',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      field: 'password_hash',
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name',
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name',
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url',
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      field: 'email_verified',
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
      allowNull: true,
    },
    failedAttempts: {
      type: DataTypes.INTEGER,
      field: 'failed_attempts',
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      field: 'locked_until',
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
    },
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.deletedAt;
    return values;
  };

  User.prototype.isLocked = function() {
    if (!this.lockedUntil) return false;
    return new Date() < new Date(this.lockedUntil);
  };

  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  return User;
};

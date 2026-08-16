const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.PasswordReset, { foreignKey: 'user_id' });
      User.hasMany(models.UserSession, { foreignKey: 'user_id' });
      User.hasMany(models.LoginActivity, { foreignKey: 'user_id' });
      User.hasMany(models.Device, { foreignKey: 'user_id' });
      User.hasMany(models.AccountActivityLog, { foreignKey: 'user_id' });
      User.hasMany(models.Folder, { foreignKey: 'user_id' });
      User.hasMany(models.File, { foreignKey: 'user_id' });
      User.hasMany(models.Tag, { foreignKey: 'user_id' });
      User.hasMany(models.Favorite, { foreignKey: 'user_id' });
      User.hasMany(models.RecentFile, { foreignKey: 'user_id' });
      User.hasMany(models.AuditLog, { foreignKey: 'user_id' });
      User.hasOne(models.TwoFactorAuth, { foreignKey: 'user_id' });
    }

    async validPassword(password) {
      return await bcrypt.compare(password, this.password_hash);
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(150)
    },
    avatar_url: {
      type: DataTypes.STRING(255)
    },
    storage_quota: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 5368709120
    },
    storage_used: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });
  
  return User;
};

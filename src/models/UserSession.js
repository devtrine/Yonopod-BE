const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSession extends Model {
    static associate(models) {
      UserSession.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  UserSession.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    session_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    ip_address: {
      type: DataTypes.STRING(45)
    },
    user_agent: {
      type: DataTypes.STRING(255)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'UserSession',
    tableName: 'user_sessions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return UserSession;
};

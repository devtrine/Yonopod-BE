const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LoginActivity extends Model {
    static associate(models) {
      LoginActivity.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  LoginActivity.init({
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
    ip_address: {
      type: DataTypes.STRING(45)
    },
    device: {
      type: DataTypes.STRING(150)
    },
    location: {
      type: DataTypes.STRING(150)
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'success'
    }
  }, {
    sequelize,
    modelName: 'LoginActivity',
    tableName: 'login_activity',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return LoginActivity;
};

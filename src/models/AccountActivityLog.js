const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccountActivityLog extends Model {
    static associate(models) {
      AccountActivityLog.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  AccountActivityLog.init({
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
    activity_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255)
    },
    ip_address: {
      type: DataTypes.STRING(45)
    }
  }, {
    sequelize,
    modelName: 'AccountActivityLog',
    tableName: 'account_activity_log',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return AccountActivityLog;
};

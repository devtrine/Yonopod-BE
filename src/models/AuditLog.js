const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  AuditLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING(50)
    },
    target_id: {
      type: DataTypes.UUID
    },
    details: {
      type: DataTypes.STRING(500)
    },
    ip_address: {
      type: DataTypes.STRING(45)
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return AuditLog;
};

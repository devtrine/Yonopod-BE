const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      // Relasi ke User (Pelaku aktivitas)
      AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      
      // Relasi ke Folder (Opsional)
      if (models.Folder) {
        AuditLog.belongsTo(models.Folder, { foreignKey: 'folder_id', as: 'folder' });
      }
      
      // Relasi ke File (Opsional)
      if (models.File) {
        AuditLog.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
      }
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
      type: DataTypes.UUID,
      allowNull: false
    },
    folder_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    file_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    event: {
      type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'DOWNLOAD', 'MOVE'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return AuditLog;
};
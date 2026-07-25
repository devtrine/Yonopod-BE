const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShareAccessLog extends Model {
    static associate(models) {
      ShareAccessLog.belongsTo(models.Share, { foreignKey: 'share_id' });
    }
  }
  
  ShareAccessLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    share_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45)
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    accessed_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ShareAccessLog',
    tableName: 'share_access_log',
    underscored: true,
    timestamps: false
  });
  
  return ShareAccessLog;
};

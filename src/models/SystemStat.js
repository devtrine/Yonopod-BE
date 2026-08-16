const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemStat extends Model {
    static associate(models) {
      // No associations
    }
  }
  
  SystemStat.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    total_storage: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    used_storage: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    total_users: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_files: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SystemStat',
    tableName: 'system_stats',
    underscored: true,
    timestamps: false
  });
  
  return SystemStat;
};

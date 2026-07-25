const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecentFile extends Model {
    static associate(models) {
      RecentFile.belongsTo(models.User, { foreignKey: 'user_id' });
      RecentFile.belongsTo(models.File, { foreignKey: 'file_id' });
    }
  }
  
  RecentFile.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accessed_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'RecentFile',
    tableName: 'recent_files',
    underscored: true,
    timestamps: false
  });
  
  return RecentFile;
};

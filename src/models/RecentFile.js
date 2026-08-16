const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecentFile extends Model {
    static associate(models) {
      RecentFile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // 💡 TAMBAHKAN alias 'as: file' di sini
      RecentFile.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    }
  }

  RecentFile.init({
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
    file_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    accessed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
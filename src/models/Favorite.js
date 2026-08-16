const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    static associate(models) {
      Favorite.belongsTo(models.User, { foreignKey: 'user_id' });
      Favorite.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
      Favorite.belongsTo(models.Folder, { foreignKey: 'folder_id', as: 'folder' });
    }
  }
  
  Favorite.init({
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
      type: DataTypes.UUID
    },
    folder_id: {
      type: DataTypes.UUID
    }
  }, {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return Favorite;
};

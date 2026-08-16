const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Folder extends Model {
    static associate(models) {
      Folder.belongsTo(models.User, { foreignKey: 'user_id' });
      Folder.belongsTo(models.Folder, { as: 'Parent', foreignKey: 'parent_id' });
      Folder.hasMany(models.Folder, { as: 'Children', foreignKey: 'parent_id' });
      Folder.hasMany(models.File, { foreignKey: 'folder_id' });
      Folder.hasMany(models.Favorite, { foreignKey: 'folder_id' });
    }
  }
  
  Folder.init({
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
    parent_id: {
      type: DataTypes.UUID
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(500)
    },
  }, {
    sequelize,
    modelName: 'Folder',
    tableName: 'folders',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });
  
  return Folder;
};

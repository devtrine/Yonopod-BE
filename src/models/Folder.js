const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Folder extends Model {
    static associate(models) {
      Folder.belongsTo(models.User, { foreignKey: 'user_id' });
      Folder.belongsTo(models.Folder, { as: 'Parent', foreignKey: 'parent_id' });
      Folder.hasMany(models.Folder, { as: 'Children', foreignKey: 'parent_id' });
      Folder.hasMany(models.File, { foreignKey: 'folder_id' });
      Folder.hasMany(models.Favorite, { foreignKey: 'folder_id' });
      Folder.hasMany(models.Share, { foreignKey: 'folder_id' });
    }
  }
  
  Folder.init({
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
    parent_id: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(500)
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    vault_password: {
      type: DataTypes.STRING(255)
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
    deletedAt: 'deleted_at'
  });
  
  return Folder;
};

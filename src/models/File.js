const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      File.belongsTo(models.User, { foreignKey: 'user_id' });
      File.belongsTo(models.Folder, { foreignKey: 'folder_id' });
      File.hasMany(models.FileTag, { foreignKey: 'file_id' });
      File.hasMany(models.Favorite, { foreignKey: 'file_id' });
      File.hasMany(models.RecentFile, { foreignKey: 'file_id' });
      File.hasMany(models.Share, { foreignKey: 'file_id' });
      File.belongsToMany(models.Tag, { through: models.FileTag, foreignKey: 'file_id' });
    }
  }
  
  File.init({
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
    folder_id: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100)
    },
    extension: {
      type: DataTypes.STRING(20)
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    checksum: {
      type: DataTypes.STRING(255)
    },
    thumbnail_path: {
      type: DataTypes.STRING(500)
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });
  
  return File;
};

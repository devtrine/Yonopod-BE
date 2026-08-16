const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FileTag extends Model {
    static associate(models) {
      FileTag.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
      FileTag.belongsTo(models.Tag, { foreignKey: 'tag_id', as: 'tag' });
    }
  }
  
  FileTag.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    file_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    tag_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'FileTag',
    tableName: 'file_tags',
    underscored: true,
    timestamps: false
  });
  
  return FileTag;
};

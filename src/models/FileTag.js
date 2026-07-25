const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FileTag extends Model {
    static associate(models) {
      FileTag.belongsTo(models.File, { foreignKey: 'file_id' });
      FileTag.belongsTo(models.Tag, { foreignKey: 'tag_id' });
    }
  }
  
  FileTag.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tag_id: {
      type: DataTypes.INTEGER,
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

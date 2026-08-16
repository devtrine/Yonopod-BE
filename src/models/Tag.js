const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      Tag.belongsTo(models.User, { foreignKey: 'user_id' });
      Tag.hasMany(models.FileTag, { foreignKey: 'tag_id', as: 'file_tags' });
      Tag.belongsToMany(models.File, { through: models.FileTag, foreignKey: 'tag_id' });
    }
  }
  
  Tag.init({
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(20)
    }
  }, {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return Tag;
};

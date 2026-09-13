const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Share extends Model {
    static associate(models) {
      // Relasi ke User pembuat link
      Share.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      
      // Relasi ke File yang dibagikan
      Share.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    }
  }
  
  Share.init({
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
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    is_terminated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Share',
    tableName: 'shares',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return Share;
};
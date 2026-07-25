const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Share extends Model {
    static associate(models) {
      Share.belongsTo(models.User, { foreignKey: 'user_id' });
      Share.belongsTo(models.File, { foreignKey: 'file_id' });
      Share.belongsTo(models.Folder, { foreignKey: 'folder_id' });
      Share.hasMany(models.ShareAccessLog, { foreignKey: 'share_id' });
    }
  }
  
  Share.init({
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
      type: DataTypes.INTEGER
    },
    folder_id: {
      type: DataTypes.INTEGER
    },
    share_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    share_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'link'
    },
    password: {
      type: DataTypes.STRING(255)
    },
    permission: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'read_only'
    },
    download_limit: {
      type: DataTypes.INTEGER
    },
    download_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    expires_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Share',
    tableName: 'shares',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return Share;
};

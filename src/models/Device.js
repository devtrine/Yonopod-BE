const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    static associate(models) {
      Device.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  Device.init({
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
    device_name: {
      type: DataTypes.STRING(150)
    },
    device_type: {
      type: DataTypes.STRING(50)
    },
    is_trusted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_active: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Device',
    tableName: 'devices',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return Device;
};

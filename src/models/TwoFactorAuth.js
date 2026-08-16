const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TwoFactorAuth extends Model {
    static associate(models) {
      TwoFactorAuth.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  TwoFactorAuth.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    secret: {
      type: DataTypes.STRING(255)
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    backup_codes: {
      type: DataTypes.STRING(500)
    }
  }, {
    sequelize,
    modelName: 'TwoFactorAuth',
    tableName: 'two_factor_auth',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return TwoFactorAuth;
};

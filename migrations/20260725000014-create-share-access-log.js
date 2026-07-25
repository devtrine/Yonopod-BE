'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('share_access_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      share_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'shares',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
      action: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      accessed_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('share_access_log');
  }
};

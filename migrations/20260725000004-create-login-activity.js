'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('login_activity', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
      device: {
        type: Sequelize.STRING(150),
      },
      location: {
        type: Sequelize.STRING(150),
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'success',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('login_activity');
  }
};

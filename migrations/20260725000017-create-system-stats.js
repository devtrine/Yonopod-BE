'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_stats', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      total_storage: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      used_storage: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      total_users: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_files: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      recorded_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('system_stats');
  }
};

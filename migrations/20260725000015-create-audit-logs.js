'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      target_type: {
        type: Sequelize.STRING(50),
      },
      target_id: {
        type: Sequelize.UUID,
      },
      details: {
        type: Sequelize.STRING(500),
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};

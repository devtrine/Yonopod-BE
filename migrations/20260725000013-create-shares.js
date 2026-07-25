'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shares', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'files',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      folder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'folders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      share_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      share_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'link',
      },
      password: {
        type: Sequelize.STRING(255),
      },
      permission: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'read_only',
      },
      download_limit: {
        type: Sequelize.INTEGER,
      },
      download_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      expires_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shares');
  }
};

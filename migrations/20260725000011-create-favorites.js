'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('favorites', {
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
      file_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'files',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      folder_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'folders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('favorites');
  }
};

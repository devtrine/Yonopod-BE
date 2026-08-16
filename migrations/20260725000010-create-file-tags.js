'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('file_tags', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      file_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'files',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('file_tags');
  }
};

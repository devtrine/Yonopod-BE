'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shares', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4 // ID ini yang nanti otomatis jadi URL Slug / Token
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_id: {
        type: Sequelize.UUID,
        allowNull: false, // Wajib ada karena "file only"
        references: {
          model: 'files',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kalau file dihapus permanen, link otomatis mati
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true // Bisa null kalau user mau link-nya aktif selamanya
      },
      total_downloads: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_terminated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shares');
  }
};
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // Sesuaikan jika nama tabel usermu berbeda
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      folder_id: {
        type: Sequelize.UUID,
        allowNull: true, // Nullable untuk kondisi log File
        references: {
          model: 'folders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      file_id: {
        type: Sequelize.UUID,
        allowNull: true, // Nullable untuk kondisi log Folder
        references: {
          model: 'files',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      event: {
        type: Sequelize.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'DOWNLOAD', 'MOVE'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
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
    await queryInterface.dropTable('audit_logs');
    // Jika pakai PostgreSQL, opsional drop type ENUM:
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_event";');
  }
};
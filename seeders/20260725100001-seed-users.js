'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@yono.dev',
        password_hash: bcrypt.hashSync('admin123', 12),
        role: 'admin',
        full_name: 'Yono Admin',
        is_active: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'johndoe',
        email: 'john@example.com',
        password_hash: bcrypt.hashSync('password123', 12),
        role: 'user',
        full_name: 'John Doe',
        is_active: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'janedoe',
        email: 'jane@example.com',
        password_hash: bcrypt.hashSync('password123', 12),
        role: 'user',
        full_name: 'Jane Doe',
        is_active: true,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};

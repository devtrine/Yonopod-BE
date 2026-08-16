'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const userRows = users[0];
    const admin = userRows.find(u => u.username === 'admin');
    const john = userRows.find(u => u.username === 'johndoe');

    if (!admin || !john) return;

    const docFolderId = uuidv4();

    await queryInterface.bulkInsert('folders', [
      {
        id: docFolderId,
        user_id: admin.id,
        name: 'Documents',
        path: '/Documents',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: admin.id,
        name: 'Photos',
        path: '/Photos',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: admin.id,
        name: 'Projects',
        path: '/Projects',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: john.id,
        name: 'My Files',
        path: '/My Files',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: john.id,
        name: 'Vacation',
        path: '/Vacation',
        parent_id: null,
        created_at: new Date()
      }
    ]);

    await queryInterface.bulkInsert('folders', [
      {
        id: uuidv4(),
        user_id: admin.id,
        name: 'Work',
        path: '/Documents/Work',
        parent_id: docFolderId,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('folders', null, {});
  }
};

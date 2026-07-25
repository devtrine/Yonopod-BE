'use strict';

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

    await queryInterface.bulkInsert('folders', [
      {
        id: 1,
        user_id: admin.id,
        name: 'Documents',
        path: '/Documents',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: 2,
        user_id: admin.id,
        name: 'Photos',
        path: '/Photos',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: 3,
        user_id: admin.id,
        name: 'Projects',
        path: '/Projects',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: 4,
        user_id: john.id,
        name: 'My Files',
        path: '/My Files',
        parent_id: null,
        created_at: new Date()
      },
      {
        id: 5,
        user_id: john.id,
        name: 'Vacation',
        path: '/Vacation',
        parent_id: null,
        created_at: new Date()
      }
    ]);

    await queryInterface.bulkInsert('folders', [
      {
        id: 6,
        user_id: admin.id,
        name: 'Work',
        path: '/Documents/Work',
        parent_id: 1,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('folders', null, {});
  }
};

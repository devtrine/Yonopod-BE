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

    await queryInterface.bulkInsert('files', [
      {
        id: 1,
        user_id: admin.id,
        folder_id: 1,
        name: 'readme.txt',
        file_path: `${admin.id}/1/${uuidv4()}-readme.txt`,
        extension: 'txt',
        created_at: new Date(),
        size: 12
      },
      {
        id: 2,
        user_id: admin.id,
        folder_id: 2,
        name: 'photo.jpg',
        file_path: `${admin.id}/2/${uuidv4()}-photo.jpg`,
        extension: 'jpg',
        created_at: new Date(),
        size: 30
      },
      {
        id: 3,
        user_id: admin.id,
        folder_id: 3,
        name: 'project-plan.pdf',
        file_path: `${admin.id}/3/${uuidv4()}-project-plan.pdf`,
        extension: 'pdf',
        created_at: new Date(),
        size: 90
      },
      {
        id: 4,
        user_id: john.id,
        folder_id: 4,
        name: 'notes.md',
        file_path: `${john.id}/4/${uuidv4()}-notes.md`,
        extension: 'md',
        created_at: new Date(),
        size: 23
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('files', null, {});
  }
};

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
        original_name: 'readme.txt',
        file_path: `${admin.id}/1/${uuidv4()}-readme.txt`,
        mime_type: 'text/plain',
        extension: 'txt',
        size: 1024,
        created_at: new Date()
      },
      {
        id: 2,
        user_id: admin.id,
        folder_id: 2,
        name: 'photo.jpg',
        original_name: 'photo.jpg',
        file_path: `${admin.id}/2/${uuidv4()}-photo.jpg`,
        mime_type: 'image/jpeg',
        extension: 'jpg',
        size: 204800,
        created_at: new Date()
      },
      {
        id: 3,
        user_id: admin.id,
        folder_id: 3,
        name: 'project-plan.pdf',
        original_name: 'project-plan.pdf',
        file_path: `${admin.id}/3/${uuidv4()}-project-plan.pdf`,
        mime_type: 'application/pdf',
        extension: 'pdf',
        size: 1024000,
        created_at: new Date()
      },
      {
        id: 4,
        user_id: john.id,
        folder_id: 4,
        name: 'notes.md',
        original_name: 'notes.md',
        file_path: `${john.id}/4/${uuidv4()}-notes.md`,
        mime_type: 'text/markdown',
        extension: 'md',
        size: 512,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('files', null, {});
  }
};

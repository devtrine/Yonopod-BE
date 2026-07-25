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

    await queryInterface.bulkInsert('tags', [
      { id: 1, user_id: admin.id, name: 'Important', color: 'red', created_at: new Date() },
      { id: 2, user_id: admin.id, name: 'Work', color: 'blue', created_at: new Date() },
      { id: 3, user_id: admin.id, name: 'Personal', color: 'green', created_at: new Date() },
      { id: 4, user_id: john.id, name: 'Urgent', color: 'orange', created_at: new Date() },
      { id: 5, user_id: john.id, name: 'Reference', color: 'purple', created_at: new Date() }
    ]);

    await queryInterface.bulkInsert('file_tags', [
      { file_id: 1, tag_id: 1 },
      { file_id: 1, tag_id: 2 },
      { file_id: 2, tag_id: 3 },
      { file_id: 3, tag_id: 1 },
      { file_id: 3, tag_id: 2 },
      { file_id: 4, tag_id: 4 }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('file_tags', null, {});
    await queryInterface.bulkDelete('tags', null, {});
  }
};

'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const [files] = await queryInterface.sequelize.query(
      `SELECT id, name, user_id FROM files;`
    );

    const admin = users.find(u => u.username === 'admin');
    const john = users.find(u => u.username === 'johndoe');

    if (!admin || !john) return;

    const tagImportantId = uuidv4();
    const tagWorkId = uuidv4();
    const tagPersonalId = uuidv4();
    const tagUrgentId = uuidv4();
    const tagReferenceId = uuidv4();

    await queryInterface.bulkInsert('tags', [
      { id: tagImportantId, user_id: admin.id, name: 'Important', color: 'red', created_at: new Date() },
      { id: tagWorkId, user_id: admin.id, name: 'Work', color: 'blue', created_at: new Date() },
      { id: tagPersonalId, user_id: admin.id, name: 'Personal', color: 'green', created_at: new Date() },
      { id: tagUrgentId, user_id: john.id, name: 'Urgent', color: 'orange', created_at: new Date() },
      { id: tagReferenceId, user_id: john.id, name: 'Reference', color: 'purple', created_at: new Date() }
    ]);

    const readmeFile = files.find(f => f.name === 'readme.txt' && f.user_id === admin.id);
    const photoFile = files.find(f => f.name === 'photo.jpg' && f.user_id === admin.id);
    const planFile = files.find(f => f.name === 'project-plan.pdf' && f.user_id === admin.id);
    const notesFile = files.find(f => f.name === 'notes.md' && f.user_id === john.id);

    const fileTags = [];
    if (readmeFile) {
      fileTags.push({ id: uuidv4(), file_id: readmeFile.id, tag_id: tagImportantId });
      fileTags.push({ id: uuidv4(), file_id: readmeFile.id, tag_id: tagWorkId });
    }
    if (photoFile) {
      fileTags.push({ id: uuidv4(), file_id: photoFile.id, tag_id: tagPersonalId });
      fileTags.push({ id: uuidv4(), file_id: photoFile.id, tag_id: tagWorkId });
    }
    if (planFile) {
      fileTags.push({ id: uuidv4(), file_id: planFile.id, tag_id: tagImportantId });
    }
    if (notesFile) {
      fileTags.push({ id: uuidv4(), file_id: notesFile.id, tag_id: tagUrgentId });
    }

    if (fileTags.length > 0) {
      await queryInterface.bulkInsert('file_tags', fileTags);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('file_tags', null, {});
    await queryInterface.bulkDelete('tags', null, {});
  }
};

'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const [folders] = await queryInterface.sequelize.query(
      `SELECT id, name, user_id FROM folders;`
    );

    const admin = users.find(u => u.username === 'admin');
    const john = users.find(u => u.username === 'johndoe');

    if (!admin || !john) return;

    const docFolder = folders.find(f => f.name === 'Documents' && f.user_id === admin.id);
    const photoFolder = folders.find(f => f.name === 'Photos' && f.user_id === admin.id);
    const projectFolder = folders.find(f => f.name === 'Projects' && f.user_id === admin.id);
    const myFilesFolder = folders.find(f => f.name === 'My Files' && f.user_id === john.id);

    await queryInterface.bulkInsert('files', [
      {
        id: uuidv4(),
        user_id: admin.id,
        folder_id: docFolder ? docFolder.id : null,
        name: 'readme.txt',
        file_path: `${admin.id}/${docFolder ? docFolder.id : 'root'}/${uuidv4()}-readme.txt`,
        extension: 'txt',
        created_at: new Date(),
        size: 12
      },
      {
        id: uuidv4(),
        user_id: admin.id,
        folder_id: photoFolder ? photoFolder.id : null,
        name: 'photo.jpg',
        file_path: `${admin.id}/${photoFolder ? photoFolder.id : 'root'}/${uuidv4()}-photo.jpg`,
        extension: 'jpg',
        created_at: new Date(),
        size: 30
      },
      {
        id: uuidv4(),
        user_id: admin.id,
        folder_id: projectFolder ? projectFolder.id : null,
        name: 'project-plan.pdf',
        file_path: `${admin.id}/${projectFolder ? projectFolder.id : 'root'}/${uuidv4()}-project-plan.pdf`,
        extension: 'pdf',
        created_at: new Date(),
        size: 90
      },
      {
        id: uuidv4(),
        user_id: john.id,
        folder_id: myFilesFolder ? myFilesFolder.id : null,
        name: 'notes.md',
        file_path: `${john.id}/${myFilesFolder ? myFilesFolder.id : 'root'}/${uuidv4()}-notes.md`,
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

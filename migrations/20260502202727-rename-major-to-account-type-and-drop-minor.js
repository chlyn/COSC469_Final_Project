'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Rename 'major' column to 'accountType'
    await queryInterface.renameColumn('Users', 'major', 'accountType');
    
    // Drop the 'minor' column
    await queryInterface.removeColumn('Users', 'minor');
  },

  async down (queryInterface, Sequelize) {
    // Reverse the changes for rollback
    await queryInterface.renameColumn('Users', 'accountType', 'major');
    await queryInterface.addColumn('Users', 'minor', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};

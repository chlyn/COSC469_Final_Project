'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      documentName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      documentType: {
        allowNull: false,
        type: Sequelize.STRING
      },
      provider: {
        allowNull: false,
        type: Sequelize.STRING
      },
      documentDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      originalName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      fileName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      filePath: {
        allowNull: false,
        type: Sequelize.STRING
      },
      size: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      mimeType: {
        allowNull: false,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Documents');
  }
};

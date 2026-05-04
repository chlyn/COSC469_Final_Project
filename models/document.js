'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Document extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Document.belongsTo(models.User, {
        foreignKey: 'userId',
      });
    }
  }

  Document.init({

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    documentName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },

  }, {

    sequelize,
    modelName: 'Document',
    tableName: 'Documents',
    timestamps: true

  });

  return Document;

};

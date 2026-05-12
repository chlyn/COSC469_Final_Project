'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class DocumentRequest extends Model {
    static associate(models) {
      DocumentRequest.belongsTo(models.User, {
        foreignKey: 'patientId',
        as: 'patient',
      });

      DocumentRequest.belongsTo(models.User, {
        foreignKey: 'providerId',
        as: 'providerUser',
      });
    }
  }

  DocumentRequest.init({

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },

  }, {

    sequelize,
    modelName: 'DocumentRequest',
    tableName: 'DocumentRequests',
    timestamps: true

  });

  return DocumentRequest;

};

'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class CareTeamRequest extends Model {
    static associate(models) {
      CareTeamRequest.belongsTo(models.User, {
        foreignKey: 'patientId',
        as: 'patient',
      });

      CareTeamRequest.belongsTo(models.User, {
        foreignKey: 'providerId',
        as: 'provider',
      });

      CareTeamRequest.belongsTo(models.User, {
        foreignKey: 'requestedByUserId',
        as: 'requester',
      });
    }
  }

  CareTeamRequest.init({

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    requestedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },

  }, {

    sequelize,
    modelName: 'CareTeamRequest',
    tableName: 'CareTeamRequests',
    timestamps: true

  });

  return CareTeamRequest;

};

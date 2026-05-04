'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class PasswordResetCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }

  PasswordResetCode.init({

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
    },
    code_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expires_at:{
      type: DataTypes.DATE,
      allowNull: false
    },

  }, {

    sequelize,
    modelName: 'PasswordResetCode',
    tableName: 'PasswordResetCodes',
    timestamps: true
  });

  return PasswordResetCode;

};
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Студент",
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "student",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

module.exports = User;

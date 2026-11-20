const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const ALLOWED_CATEGORIES = [
  "Программирование",
  "Backend",
  "Frontend",
  "Базы данных",
  "DevOps",
  "Мобильная разработка",
  "Data Science",
  "Дизайн",
  "Маркетинг",
  "Аналитика",
];

const ALLOWED_LEVELS = ["Начальный", "Средний", "Продвинутый"];

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Название курса обязательно" },
        len: {
          args: [3, 150],
          msg: "Название курса должно содержать от 3 до 150 символов",
        },
      },
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Категория обязательна" },
        isIn: {
          args: [ALLOWED_CATEGORIES],
          msg: "Категория должна быть из предложенного списка",
        },
      },
    },
    durationHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: "Длительность должна быть целым числом" },
        min: {
          args: [1],
          msg: "Длительность не может быть меньше 1 часа",
        },
        max: {
          args: [500],
          msg: "Длительность не может быть больше 500 часов",
        },
      },
    },
    level: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Начальный",
      validate: {
        isIn: {
          args: [ALLOWED_LEVELS],
          msg: "Уровень должен быть одним из: Начальный, Средний, Продвинутый",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: "Описание не должно превышать 1000 символов",
        },
      },
    },
  },
  {
    tableName: "courses",
    timestamps: true,
  },
);

Course.ALLOWED_CATEGORIES = ALLOWED_CATEGORIES;
Course.ALLOWED_LEVELS = ALLOWED_LEVELS;

module.exports = Course;

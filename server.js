require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");

const sequelize = require("./models");
const Course = require("./models/Course");
const User = require("./models/User");
const validators = require("./utils/validators");
const {
  requestLogger,
  blockIfLogsDown,
  writeLogLine,
} = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Логирование запросов
app.use(requestLogger);

// Имитация авторизации
app.use((req, res, next) => {
  if (req.query.auth === "1") {
    req.user = { name: "Студент", role: "student" };
  } else {
    req.user = { name: "Гость", role: "guest" };
  }
  res.locals.user = req.user;
  res.locals.success = req.query.success || null;
  next();
});

// Главная
app.get("/", async (req, res, next) => {
  try {
    const courses = await Course.findAll({ order: [["id", "ASC"]] });
    res.render("index", {
      title: "Платформа онлайн-курсов — Главная",
      courses,
    });
  } catch (err) {
    next(err);
  }
});

// Детальная страница курса
app.get("/item/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return next();
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return next();
    }

    res.render("item", {
      title: `Курс: ${course.title}`,
      course,
    });
  } catch (err) {
    next(err);
  }
});

// Форма добавления курса
app.get("/add", blockIfLogsDown, (req, res) => {
  res.render("add", {
    title: "Добавить новый курс",
  });
});

// Создание курса
app.post("/add", blockIfLogsDown, async (req, res, next) => {
  try {
    if (!validators.hasRequiredCourseFields(req.body)) {
      return res.status(400).render("add", {
        title: "Добавить новый курс",
        errors: ["Ошибка валидации: переданы не все обязательные поля"],
        formData: req.body,
      });
    }

    const validation = validators.validateCourse(req.body);

    if (!validation.isValid) {
      return res.status(400).render("add", {
        title: "Добавить новый курс",
        errors: validation.errors,
        formData: req.body,
      });
    }

    await Course.create(validation.data);
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

// Вход
app.get("/login", (req, res) => {
  res.render("login", { title: "Авторизация" });
});

app.post("/login", async (req, res, next) => {
  try {
    const validation = validators.validateLogin(req.body);

    if (!validation.isValid) {
      return res.status(400).render("login", {
        title: "Авторизация",
        errors: validation.errors,
        formData: req.body,
      });
    }

    const { email, password } = validation.data;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).render("login", {
        title: "Авторизация",
        errors: ["Неверные учетные данные"],
        formData: req.body,
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).render("login", {
        title: "Авторизация",
        errors: ["Неверные учетные данные"],
        formData: req.body,
      });
    }

    res.redirect("/?auth=1&success=login");
  } catch (err) {
    next(err);
  }
});

// Регистрация
app.get("/register", (req, res) => {
  res.render("register", { title: "Регистрация" });
});

app.post("/register", async (req, res, next) => {
  try {
    const validation = validators.validateRegistration(req.body);

    if (!validation.isValid) {
      return res.status(400).render("register", {
        title: "Регистрация",
        errors: validation.errors,
        formData: req.body,
      });
    }

    const { email, password, name } = validation.data;
    const existing = await User.findOne({ where: { email } });

    if (existing) {
      return res.status(409).render("register", {
        title: "Регистрация",
        errors: ["Пользователь с таким email уже зарегистрирован"],
        formData: req.body,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      email,
      passwordHash,
      name: name || "Студент",
      role: "student",
    });

    res.redirect("/login?success=registered");
  } catch (err) {
    next(err);
  }
});

// Обработка 404
app.use((req, res) => {
  const now = new Date().toISOString();
  writeLogLine(`[${now}] 404 NOT FOUND ${req.method} ${req.originalUrl}`);

  if (req.xhr || req.is("application/json") || req.path.startsWith("/api")) {
    return res
      .status(404)
      .json({ success: false, message: "Страница не найдена" });
  }

  res.status(404).render("404", { title: "Страница не найдена" });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const now = new Date().toISOString();

  writeLogLine(
    `[${now}] ERROR ${req.method} ${req.originalUrl} - Status: ${status}`,
  );
  console.error(err.stack);

  if (req.xhr || req.is("application/json") || req.path.startsWith("/api")) {
    return res.status(status).json({
      success: false,
      message: "Внутренняя ошибка сервера. Попробуйте позже.",
    });
  }

  res.status(status).render("500", {
    title: "Ошибка сервера",
    statusCode: status,
    message: "Внутренняя ошибка сервера. Попробуйте позже.",
  });
});

// Запуск сервера и сид данных
async function start() {
  try {
    await sequelize.authenticate();
    console.log("Подключение к PostgreSQL установлено");

    await sequelize.sync({ alter: true });
    console.log("Таблицы синхронизированы");

    const existingUser = await User.findOne({
      where: { email: "admin@example.com" },
    });
    if (!existingUser) {
      const hash = await bcrypt.hash("admin123", 12);
      await User.create({
        email: "admin@example.com",
        passwordHash: hash,
        name: "Администратор",
        role: "admin",
      });
      console.log("Создан тестовый пользователь: admin@example.com / admin123");
    }

    const count = await Course.count();
    if (count === 0) {
      await Course.bulkCreate([
        {
          title: "Основы JavaScript",
          category: "Программирование",
          durationHours: 20,
          level: "Начальный",
          description: "Базовый курс по синтаксису, функциям и работе с DOM.",
        },
        {
          title: "Веб-разработка на Node.js",
          category: "Backend",
          durationHours: 35,
          level: "Средний",
          description:
            "Изучение Express, REST API, middleware и шаблонизаторов.",
        },
      ]);
      console.log("Добавлены стартовые курсы");
    }

    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Ошибка запуска:", err);
  }
}

start();

// ============================================================
// МОДУЛЬ ВАЛИДАЦИИ
// Синтаксическая, семантическая и бизнес-валидация данных
// ============================================================

// ============ СПИСКИ ДЛЯ ПРОВЕРОК ============

// Распространённые пароли, которые запрещены
const COMMON_PASSWORDS = [
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "qwerty",
  "qwerty123",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "iloveyou",
  "abc123",
  "111111",
  "000000",
  "qwertyuiop",
  "пароль",
];

// Доменные зоны, которые считаем валидными
const VALID_TLDS = [
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "ru",
  "by",
  "kz",
  "ua",
  "uk",
  "de",
  "fr",
  "it",
  "es",
  "jp",
  "cn",
  "us",
  "ca",
  "au",
  "br",
  "in",
  "pl",
  "cz",
  "info",
  "biz",
  "io",
  "dev",
  "app",
  "online",
  "site",
  "tech",
];

// Запрещённые слова (для названий и логинов)
const FORBIDDEN_WORDS = [
  "admin",
  "root",
  "system",
  "test",
  "null",
  "undefined",
];

// ============ СИНТАКСИЧЕСКАЯ ВАЛИДАЦИЯ ============

// --- Валидация email ---
function validateEmail(email) {
  if (typeof email !== "string") {
    return { isValid: false, error: "Email должен быть строкой" };
  }
  email = email.trim();

  if (!email) {
    return { isValid: false, error: "Введите email" };
  }

  if (email.length < 6) {
    return {
      isValid: false,
      error: "Email слишком короткий (минимум 6 символов)",
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      error: "Email слишком длинный (максимум 254 символа)",
    };
  }

  if (/\s/.test(email)) {
    return { isValid: false, error: "Email не может содержать пробелы" };
  }

  if ((email.match(/@/g) || []).length !== 1) {
    return {
      isValid: false,
      error: "Email должен содержать ровно один символ @",
    };
  }

  if (email.startsWith(".") || email.endsWith(".")) {
    return {
      isValid: false,
      error: "Email не может начинаться или заканчиваться точкой",
    };
  }

  if (email.includes("..")) {
    return {
      isValid: false,
      error: "Email не может содержать две точки подряд",
    };
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || localPart.length > 64) {
    return {
      isValid: false,
      error: "Локальная часть email некорректна (максимум 64 символа)",
    };
  }

  if (!domain || domain.length > 253) {
    return { isValid: false, error: "Доменная часть email некорректна" };
  }

  // Локальная часть: буквы, цифры, и . _ % + -
  const localRegex = /^[A-Za-z0-9._%+-]+$/;
  if (!localRegex.test(localPart)) {
    return {
      isValid: false,
      error: "Локальная часть email содержит недопустимые символы",
    };
  }

  // Домен: буквы, цифры, дефисы, точки
  const domainRegex = /^[A-Za-z0-9.-]+$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: "Домен содержит недопустимые символы" };
  }

  if (!domain.includes(".")) {
    return {
      isValid: false,
      error: "Домен должен содержать точку (например, mail.com)",
    };
  }

  if (domain.startsWith("-") || domain.endsWith("-")) {
    return {
      isValid: false,
      error: "Домен не может начинаться или заканчиваться дефисом",
    };
  }

  const tld = domain.split(".").pop().toLowerCase();
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return {
      isValid: false,
      error: "Некорректная доменная зона (например, .com, .ru, .by)",
    };
  }

  if (!VALID_TLDS.includes(tld)) {
    return {
      isValid: false,
      error: `Доменная зона .${tld} не поддерживается. Используйте .com, .ru, .by и т.п.`,
    };
  }

  return { isValid: true, value: email.toLowerCase() };
}

// --- Валидация пароля ---
function validatePassword(password) {
  if (typeof password !== "string") {
    return { isValid: false, error: "Пароль должен быть строкой" };
  }

  if (!password) {
    return { isValid: false, error: "Введите пароль" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Пароль должен содержать минимум 6 символов",
    };
  }

  if (password.length > 30) {
    return { isValid: false, error: "Пароль не должен превышать 30 символов" };
  }

  if (/\s/.test(password)) {
    return { isValid: false, error: "Пароль не может содержать пробелы" };
  }

  if (!/[A-Za-zА-Яа-я]/.test(password)) {
    return {
      isValid: false,
      error: "Пароль должен содержать хотя бы одну букву",
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: "Пароль должен содержать хотя бы одну цифру",
    };
  }

  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return {
      isValid: false,
      error: "Этот пароль слишком распространён, выберите другой",
    };
  }

  // Проверка на однообразные пароли (aaaaaa, 111111)
  if (/^(.)\1+$/.test(password)) {
    return {
      isValid: false,
      error: "Пароль не может состоять из одного повторяющегося символа",
    };
  }

  // Проверка на последовательность (123456, abcdef)
  const sequences = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];
  const lower = password.toLowerCase();
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 6; i++) {
      if (lower.includes(seq.substring(i, i + 6))) {
        return {
          isValid: false,
          error:
            "Пароль не должен содержать последовательности (123456, qwerty и т.п.)",
        };
      }
    }
  }

  return { isValid: true, value: password };
}

// --- Валидация строки ---
function validateString(value, options = {}) {
  const {
    fieldName = "Поле",
    minLength = 1,
    maxLength = 100,
    required = true,
    pattern = null,
    patternError = "Недопустимые символы",
    noForbiddenWords = false,
  } = options;

  if (typeof value !== "string") {
    value = value == null ? "" : String(value);
  }
  value = value.trim();

  if (required && !value) {
    return { isValid: false, error: `${fieldName} обязательно для заполнения` };
  }

  if (!required && !value) {
    return { isValid: true, value: "" };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} должен содержать минимум ${minLength} символов`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} не должен превышать ${maxLength} символов`,
    };
  }

  if (pattern && !pattern.test(value)) {
    return { isValid: false, error: patternError };
  }

  if (noForbiddenWords) {
    const lower = value.toLowerCase();
    for (const w of FORBIDDEN_WORDS) {
      if (lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w)) {
        return {
          isValid: false,
          error: `${fieldName} содержит запрещённое слово "${w}"`,
        };
      }
    }
  }

  return { isValid: true, value };
}

// --- Валидация числа ---
function validateNumber(value, options = {}) {
  const {
    fieldName = "Значение",
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    integer = true,
  } = options;

  if (value === "" || value == null) {
    return { isValid: false, error: `${fieldName} обязательно для заполнения` };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} должно быть числом` };
  }

  if (!isFinite(num)) {
    return {
      isValid: false,
      error: `${fieldName} должно быть конечным числом`,
    };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} должно быть целым числом` };
  }

  if (num < min) {
    return {
      isValid: false,
      error: `${fieldName} не может быть меньше ${min}`,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      error: `${fieldName} не может быть больше ${max}`,
    };
  }

  return { isValid: true, value: num };
}

// ============ СЕМАНТИЧЕСКАЯ ВАЛИДАЦИЯ ============

// --- Валидация регистрации ---
function validateRegistration(data) {
  const errors = [];

  const nameResult = validateString(data.name, {
    fieldName: "Имя",
    minLength: 2,
    maxLength: 50,
    required: false,
    pattern: /^[A-Za-zА-Яа-яЁё\s\-]+$/,
    patternError: "Имя может содержать только буквы, пробелы и дефисы",
  });
  if (!nameResult.isValid) errors.push(nameResult.error);

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) errors.push(emailResult.error);

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) errors.push(passwordResult.error);

  // Перекрёстная проверка: email не совпадает с именем
  if (nameResult.isValid && emailResult.isValid) {
    const nameLower = (nameResult.value || "").toLowerCase().replace(/\s/g, "");
    const emailLocal = emailResult.value.split("@")[0];
    if (nameLower && emailLocal === nameLower) {
      errors.push("Email не должен совпадать с именем");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: nameResult.isValid ? nameResult.value || "Студент" : "",
      email: emailResult.isValid ? emailResult.value : "",
      password: passwordResult.isValid ? passwordResult.value : "",
    },
  };
}

// --- Валидация логина ---
function validateLogin(data) {
  const errors = [];

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) errors.push(emailResult.error);

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) errors.push(passwordResult.error);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: emailResult.isValid ? emailResult.value : "",
      password: passwordResult.isValid ? passwordResult.value : "",
    },
  };
}

// --- Валидация курса ---
function validateCourse(data) {
  const errors = [];

  const titleResult = validateString(data.title, {
    fieldName: "Название курса",
    minLength: 3,
    maxLength: 150,
    pattern: /^[A-Za-zА-Яа-яЁё0-9\s\-.,:;!?()]+$/,
    patternError:
      "Название содержит недопустимые символы. Разрешены буквы, цифры, пробелы, знаки .,:;!?()-",
  });
  if (!titleResult.isValid) errors.push(titleResult.error);

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

  const categoryRaw = (data.category || "").trim();
  let categoryResult;
  if (!categoryRaw) {
    categoryResult = {
      isValid: false,
      error: "Категория обязательна для заполнения",
    };
  } else if (!ALLOWED_CATEGORIES.includes(categoryRaw)) {
    categoryResult = {
      isValid: false,
      error: `Категория должна быть одной из: ${ALLOWED_CATEGORIES.join(", ")}`,
    };
  } else {
    categoryResult = { isValid: true, value: categoryRaw };
  }
  if (!categoryResult.isValid) errors.push(categoryResult.error);

  const durationResult = validateNumber(data.durationHours, {
    fieldName: "Длительность",
    min: 1,
    max: 500,
    integer: true,
  });
  if (!durationResult.isValid) errors.push(durationResult.error);

  const allowedLevels = ["Начальный", "Средний", "Продвинутый"];
  const levelResult = validateString(data.level, {
    fieldName: "Уровень",
    minLength: 2,
    maxLength: 50,
  });
  if (!levelResult.isValid) {
    errors.push(levelResult.error);
  } else if (!allowedLevels.includes(levelResult.value)) {
    errors.push(`Уровень должен быть одним из: ${allowedLevels.join(", ")}`);
  }

  const descriptionResult = validateString(data.description, {
    fieldName: "Описание",
    minLength: 5,
    maxLength: 1000,
    required: false,
  });
  if (!descriptionResult.isValid) errors.push(descriptionResult.error);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      title: titleResult.isValid ? titleResult.value : "",
      category: categoryResult.isValid ? categoryResult.value : "",
      durationHours: durationResult.isValid ? durationResult.value : 0,
      level: levelResult.isValid ? levelResult.value : "Начальный",
      description: descriptionResult.isValid
        ? descriptionResult.value || "Описание отсутствует."
        : "",
    },
  };
}

function hasRequiredCourseFields(data = {}) {
  const requiredFields = ["title", "category", "durationHours"];

  return requiredFields.every((field) => {
    const val = data[field];
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
}



module.exports = {
  COMMON_PASSWORDS,
  VALID_TLDS,
  FORBIDDEN_WORDS,
  validateEmail,
  validatePassword,
  validateString,
  validateNumber,
  hasRequiredCourseFields,
  validateRegistration,
  validateLogin,
  validateCourse,
};

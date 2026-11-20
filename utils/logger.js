const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../server.log");
let logFileUnavailable = false;

if (!fs.existsSync(logFilePath)) {
  try {
    fs.writeFileSync(logFilePath, "", "utf8");
    console.log("[LOGGER INFO] Файл server.log создан при запуске.");
  } catch (err) {
    console.error(
      "[LOGGER ERROR] Не удалось создать файл системного журнала при запуске.",
    );
    logFileUnavailable = true;
  }
}

function writeLogLine(message) {
  const line = `${message}\n`;

  fs.stat(logFilePath, (err, stats) => {
    if (err) {
      console.error(
        "[LOGGER ERROR] Невозможно получить доступ к server.log. Проверьте наличие файла и права доступа.",
      );
      logFileUnavailable = true;
      return;
    }

    if (!stats.isFile()) {
      console.error(
        "[LOGGER ERROR] Некорректный формат server.log. Запись невозможна.",
      );
      logFileUnavailable = true;
      return;
    }

    fs.appendFile(logFilePath, line, "utf8", (appendErr) => {
      if (appendErr) {
        console.error("[LOGGER ERROR] Сбой при записи в server.log.");
        logFileUnavailable = true;
      } else if (logFileUnavailable) {
        console.log(
          "[LOGGER INFO] Системный журнал восстановлен. Блокировка снята.",
        );
        logFileUnavailable = false;
      }
    });
  });
}

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`;

    console.log(logMessage);
    writeLogLine(logMessage);
  });

  next();
};

const blockIfLogsDown = (req, res, next) => {
  if (logFileUnavailable) {
    const message = "Сервис временно недоступен: системный журнал не доступен.";

    if (req.xhr || req.is("application/json") || req.path.startsWith("/api")) {
      return res.status(503).json({ success: false, message });
    }

    return res.status(503).render("500", {
      title: "Сервис временно недоступен",
      statusCode: 503,
      message,
    });
  }

  next();
};

module.exports = {
  requestLogger,
  blockIfLogsDown,
  writeLogLine,
  isLogFileUnavailable: () => logFileUnavailable,
};

const path = require("path");
require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const medicineRoutes = require("./routes/medicineRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const adherenceRoutes = require("./routes/adherenceRoutes");
const pushRoutes = require("./routes/pushRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { initReminderSchedulers } = require("./services/reminderSchedulers");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust proxy (needed for Render / reverse proxy)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// CORS
const envOrigins = (process.env.CLIENT_ORIGIN || "*")
  .split(/[\s,]+/) // Split by comma OR space
  .map(s => s.trim().replace(/[^\x20-\x7E]/g, "").replace(/\/+$/, "")) // Remove control chars & trailing slashes
  .filter(Boolean);

// Hardcode the Vercel URLs just in case the user's Render variable has a typo
const allowedOrigins = [...new Set([...envOrigins, "https://smart-swaasth.vercel.app", "https://smartswaasth.vercel.app"])];

app.use(cors({
  origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*"
    ? "*"
    : allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", medicineRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);
app.use("/api/adherence", adherenceRoutes);
app.use("/api/push", pushRoutes);

app.use(errorHandler);

const http = require("http");
const { initSocket } = require("./config/socket");

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    try {
      await initReminderSchedulers();
    } catch (err) {
      console.error("Reminder scheduler init failed:", err.message || err);
    }
    
    initSocket(server, allowedOrigins.length === 1 && allowedOrigins[0] === "*" ? "*" : allowedOrigins);

    server.listen(PORT, () => {
      console.log(`SmartSwaasth server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

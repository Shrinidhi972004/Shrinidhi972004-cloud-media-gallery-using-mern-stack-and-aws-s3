const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const errorMiddleware = require('./middlewares/errorMiddleware');
const validateEnvironment = require('./config/validateEnv');

dotenv.config();
validateEnvironment();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many uploads, try again later.",
});
app.use("/api/gallery/upload", uploadLimiter);

app.use(morgan(process.env.NODE_ENV !== "production" ? "dev" : "combined"));
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:9000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => res.send("🚀 Server running successfully!"));

app.get("/health", (req, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/gallery", require("./routes/gallery"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

app.use(errorMiddleware);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);

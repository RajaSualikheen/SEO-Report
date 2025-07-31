// backend/index.js

const express = require("express");
const cors = require("cors");
const seoReportRouter = require("./routes/seoReport.js");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Allowed CORS origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://seoanalyzerauth.web.app",
  "http://localhost:3000"
];

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "*",
  exposedHeaders: "*"
}));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the SEO Analyzer API!" });
});

// Use router
app.use("/api", seoReportRouter); // same as FastAPI's include_router

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

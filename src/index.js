const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB, disconnectDB } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const myEventsRoutes = require("./routes/myEvents.routes");
const joinedEventRoutes = require("./routes/joinedEvent.routes");

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Social Development Events server is running");
});

app.use("/api", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/my-events", myEventsRoutes);
app.use("/api/joined-events", joinedEventRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error" });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

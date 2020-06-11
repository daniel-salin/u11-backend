import { Application, Request, Response, NextFunction } from "express";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const app: Application = express();
const bodyParser = require("body-parser");
const logsRoute = require("./routes/logs");
const imagesRoute = require("./routes/images");
const cors = require("cors");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const Log = require("./models/Log");

// MIDDLEWARES
const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }),
  audience: process.env.JWKS_AUDIENCE,
  issuer: process.env.JWKS_ISSUER,
  algorithms: ["RS256"],
});

app.use(jwtCheck);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ROUTES
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    const path = require("path");
    console.log(err);
    res.status(err.status).sendFile(__dirname + path.join("/errorPage.html"));
    return;
  }
  next();
});

app.use("/logs", logsRoute);
app.use("/images", imagesRoute);

// CONNECT TO DB
const mongoURI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER_URL}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

try {
  mongoose.connect(
    mongoURI,
    {
      useFindAndModify: false,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    },
    () => {
      console.log("connected to DB!");
    }
  );
} catch (error) {
  console.log(error);
}

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("DB connection open");
});
connection.once("error", (err: any) => {
  console.log("Error connecting ", err);
});

// RUNNING SURVEILLANCE SCRIPT
const spawn = require("child_process").spawn;

const pythonProcess = spawn("python3", [__dirname + "/surveillo.py"]);

console.log("running py script", __dirname);

pythonProcess.stdout.on("data", async (data: any) => {
  const isSystemMessage = data.toString().includes("[INFO]");
  console.log(`stdout: ${data}`);
  if (!isSystemMessage) {
    const timestamp = data
      .toString()
      .split("__")[2]
      .replace("\n", "")
      .split("_")
      .join(":");
    const date = data.toString().split("__")[0].replace("\n", "");
    const path = `${date}/${timestamp.split(":").join("_")}.jpg`;
    // WRITE TO DATABASE
    const log = new Log({
      date: date,
    });
    try {
      const newLog = await Log.findOneAndUpdate(
        { date: date },
        { $push: { images: { path: path, timeStamp: timestamp } } },
        { upsert: true, returnNewDocument: true }
      );
    } catch (err) {
      console.log(err);
    }
  }
});

pythonProcess.stderr.on("data", (data: any) => {
  console.error(`stderr: ${data}`);
});

pythonProcess.on("close", (code: any) => {
  console.log(`child process exited with code ${code}`);
});

app.listen(port, () => console.log(`Server is listening on port: ${port}`));

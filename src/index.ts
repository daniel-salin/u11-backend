import express, { Application, Request, Response, NextFunction } from "express";
import dotenv = require("dotenv");

const port = process.env.PORT || 3000;

const app: Application = express();

app.get("/", (_req: Request, res: Response, _next: NextFunction) => {
  res.send("HELLO THERE WORLD ");
});

app.listen(port, () => console.log(`Server is listening on port: ${port}`));

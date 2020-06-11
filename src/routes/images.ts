import { Application, Request, Response, NextFunction } from "express";
const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const fs = require("fs");

// GET ONE
router.get(
  "/:image",
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = require("path");
    const options = { root: path.join(__dirname, "../archive") };

    const imagePath = req.params.image.replace("__", "/");
    const imageFile = `${imagePath}.jpg`;
    const imageFilePath = __dirname + `/../archive/${imagePath}.jpg`;

    if (fs.existsSync(imageFilePath)) {
      res.sendFile(imageFile, options);
    } else {
      res.send("File does not exist on unit");
    }
  }
);

module.exports = router;

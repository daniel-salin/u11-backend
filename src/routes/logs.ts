import { Application, Request, Response, NextFunction } from "express";
const express = require("express");
const router = express.Router();
const Log = require("../models/Log");

// GET ALL
router.get("/", async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const logs = await Log.find();
    console.log(logs);
    res.json(logs);
  } catch (err) {
    res.json({ message: err });
  }
});

// GET ALL
router.get(
  "/:logId",
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const logId = req.params.logId;
      const log = await Log.findById(logId);
      res.json(log);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

// POST
router.post("/", async (req: Request, res: Response, _next: NextFunction) => {
  const log = new Log({
    date: req.body.date,
    images: req.body.images,
  });

  try {
    const savedLog = await log.save();
    res.json(savedLog);
  } catch (err) {
    res.json({ message: err });
  }
});

// DELETE
router.delete(
  "/:logId",
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const logId = req.params.logId;
      const removedLog = await Log.remove({ _id: logId });
      res.json(removedLog);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

// UPDATE
router.patch(
  "/:logId",
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const logId = req.params.logId;
      const updatedLog = await Log.updateOne(
        { _id: logId },
        {
          $set: { date: req.body.date, images: req.body.images },
        }
      );
      res.json(updatedLog);
    } catch (err) {
      res.json({ message: err });
    }
  }
);

module.exports = router;

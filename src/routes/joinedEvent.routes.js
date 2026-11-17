const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

const JOINED_EVENTS_COLLECTION = "joined_events";

router.post("/", verifyJWT, async (req, res, next) => {
  try {
    const { eventId, userEmail } = req.body;

    if (!eventId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "eventId and userEmail are required",
      });
    }

    if (userEmail !== req.decoded.email) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }

    if (!ObjectId.isValid(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid eventId" });
    }

    const eventsDb = getDb().collection("events");
    const joinedDb = getDb().collection(JOINED_EVENTS_COLLECTION);

    const event = await eventsDb.findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const existingJoin = await joinedDb.findOne({
      eventId,
      userEmail,
    });

    if (existingJoin) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this event",
      });
    }

    const doc = {
      eventId,
      userEmail,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventType: event.eventType,
      thumbnail: event.thumbnail,
      location: event.location,
      creatorEmail: event.creatorEmail,
      joinedAt: new Date(),
    };

    const result = await joinedDb.insertOne(doc);

    res.status(201).send({
      success: true,
      message: "Joined event successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", verifyJWT, async (req, res, next) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email query param is required" });
    }

    if (email !== req.decoded.email) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }

    const joined = await getDb()
      .collection(JOINED_EVENTS_COLLECTION)
      .find({ userEmail: email })
      .sort({ eventDate: 1 })
      .toArray();

    res.send(joined);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

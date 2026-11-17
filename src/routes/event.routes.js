const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

const EVENTS_COLLECTION = "events";
const EVENT_TYPES = [
  "Cleanup Drive",
  "Plantation",
  "Donation Drive",
  "Food Distribution",
  "Blood Donation",
  "Awareness Campaign",
  "Community Teaching",
  "Elder Care",
];
const CLIENT_EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Awareness",
  "Relief",
];
const ALLOWED_EVENT_TYPES = new Set([...EVENT_TYPES, ...CLIENT_EVENT_TYPES]);

const buildUpcomingFilter = (req) => {
  const filter = { eventDate: { $gte: new Date() } };

  const { search, type } = req.query;
  if (search && typeof search === "string" && search.trim()) {
    filter.title = { $regex: search.trim(), $options: "i" };
  }
  if (type && typeof type === "string" && type.trim()) {
    filter.eventType = type.trim();
  }

  return filter;
};

const validateEventPayload = (body, creatorEmail) => {
  const { title, description, eventType, thumbnailUrl, thumbnail, location,
    eventDate } = body;

  const thumbnailValue = thumbnailUrl || thumbnail;

  if (
    !title ||
    !description ||
    !eventType ||
    !thumbnailValue ||
    !location ||
    !eventDate ||
    !creatorEmail
  ) {
    return "All fields (title, description, eventType, thumbnailUrl, location, eventDate) are required";
  }

  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return `Invalid eventType. Allowed types: ${[...ALLOWED_EVENT_TYPES].join(", ")}`;
  }

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "eventDate must be a valid date";
  }

  if (parsedDate.getTime() <= Date.now()) {
    return "eventDate must be strictly in the future";
  }

  return null;
};

router.get("/recent", async (req, res, next) => {
  try {
    const events = await getDb()
      .collection(EVENTS_COLLECTION)
      .find(buildUpcomingFilter(req))
      .sort({ eventDate: 1 })
      .limit(6)
      .toArray();

    res.send(events);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const events = await getDb()
      .collection(EVENTS_COLLECTION)
      .find(buildUpcomingFilter(req))
      .sort({ eventDate: 1 })
      .toArray();

    res.send(events);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event id" });
    }

    const event = await getDb()
      .collection(EVENTS_COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.send(event);
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyJWT, async (req, res, next) => {
  try {
    const creatorEmail = req.decoded.email;

    const validationError = validateEventPayload(req.body, creatorEmail);
    if (validationError) {
      return res
        .status(400)
        .json({ success: false, message: validationError });
    }

    const doc = {
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      eventType: req.body.eventType,
      thumbnail: (req.body.thumbnailUrl || req.body.thumbnail).trim(),
      location: req.body.location.trim(),
      eventDate: new Date(req.body.eventDate),
      creatorEmail,
      creatorName: req.body.creatorName || "",
      createdAt: new Date(),
    };

    const result = await getDb()
      .collection(EVENTS_COLLECTION)
      .insertOne(doc);

    res.status(201).send({
      success: true,
      message: "Event created successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("Event creation failed:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to create event",
    });
  }
});

router.put("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event id" });
    }

    const existingEvent = await getDb()
      .collection(EVENTS_COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!existingEvent) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (existingEvent.creatorEmail !== req.decoded.email) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }

    const validationError = validateEventPayload(
      req.body,
      existingEvent.creatorEmail
    );
    if (validationError) {
      return res
        .status(400)
        .json({ success: false, message: validationError });
    }

    const updates = {
      $set: {
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        eventType: req.body.eventType,
        thumbnail: (req.body.thumbnailUrl || req.body.thumbnail).trim(),
        location: req.body.location.trim(),
        eventDate: new Date(req.body.eventDate),
        updatedAt: new Date(),
      },
    };

    await getDb()
      .collection(EVENTS_COLLECTION)
      .updateOne({ _id: new ObjectId(req.params.id) }, updates);

    const updatedEvent = await getDb()
      .collection(EVENTS_COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    res.send({ success: true, message: "Event updated", event: updatedEvent });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event id" });
    }

    const existingEvent = await getDb()
      .collection(EVENTS_COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!existingEvent) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (existingEvent.creatorEmail !== req.decoded.email) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }

    const result = await getDb()
      .collection(EVENTS_COLLECTION)
      .deleteOne({ _id: new ObjectId(req.params.id) });

    res.send({
      success: true,
      message: "Event deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

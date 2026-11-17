const express = require("express");
const { getDb } = require("../config/db");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

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

    const events = await getDb()
      .collection("events")
      .find({ creatorEmail: email })
      .sort({ eventDate: 1 })
      .toArray();

    res.send(events);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

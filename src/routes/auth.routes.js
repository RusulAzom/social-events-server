const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const router = express.Router();

router.post("/jwt", async (req, res, next) => {
  try {
    const { sessionToken } = req.body || {};

    if (!sessionToken || typeof sessionToken !== "string") {
      return res
        .status(401)
        .json({ success: false, message: "A valid BetterAuth session is required" });
    }

    const db = getDb();
    const session = await db.collection("session").findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "BetterAuth session is invalid or expired" });
    }

    const sessionUserId = session.userId?.toString();
    const userIds = [session.userId, sessionUserId].filter(Boolean);
    if (sessionUserId && ObjectId.isValid(sessionUserId)) {
      userIds.push(new ObjectId(sessionUserId));
    }
    const user = await db.collection("user").findOne({
      $or: [{ id: { $in: userIds } }, { _id: { $in: userIds } }],
    });
    const userId = (user?.id ?? user?._id)?.toString();

    if (!user || !sessionUserId || userId !== sessionUserId) {
      return res
        .status(401)
        .json({ success: false, message: "BetterAuth session user was not found" });
    }

    const role = user.role || "user";

    const token = jwt.sign(
      { email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.send({ success: true, token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

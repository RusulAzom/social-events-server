const express = require("express");
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/db");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/jwt", async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await getDb()
      .collection("user")
      .findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
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

const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const controller = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createAuthMiddleware(["user"]), controller.createOrder);

module.exports = router;

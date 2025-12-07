const express = require("express");
const createAuthMiddleware = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');
const validation = require("../middlewares/validation.middleware");

const router = express.Router();


router.post('/items', createAuthMiddleware(['user']), validation.validateAddItemToCart, cartController.addItemToCart);


module.exports = router;
const express = require('express');
const validators = require('../middleware/validator.middleware')
const authController = require('../controllers/auth.controller')


const router = express.Router();

router.post("/register", validators.registerUserValidations, authController.registerUser);


router.post('/login', validators.loginUserValidations, authController.loginUser);

module.exports = router;
const express = require('express');
const validators = require('../middleware/validator.middleware')
const authController = require('../controllers/auth.controller');
const  { authMiddleware } = require('../middleware/auth.middleware');


const router = express.Router();

router.post("/register", validators.registerUserValidations, authController.registerUser);


router.post('/login', validators.loginUserValidations, authController.loginUser);

router.get('/me', authMiddleware, authController.getCurrentUser);

router.get('/logout', authController.logoutUser)

module.exports = router;
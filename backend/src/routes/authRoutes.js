const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

/**
 * Authentication Routes
 * Handles user registration and login
 */

// POST /api/auth/signup - Create new user account
router.post('/signup', signup);

// POST /api/auth/login - Login user and get JWT token
router.post('/login', login);

module.exports = router;


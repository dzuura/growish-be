const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer();
const authController = require('../controllers/authController');

router.post('/register', upload.none(), authController.register);
router.post('/login', upload.none(), authController.login);
router.post('/logout', authController.logout);

module.exports = router;
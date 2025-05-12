const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/', authenticateToken, checkRole(['researcher']), categoryController.getCategories);
router.get('/:id', authenticateToken, checkRole(['researcher']), categoryController.getCategoryById);
router.post('/', authenticateToken, checkRole(['researcher']), categoryController.createCategory);
router.put('/:id', authenticateToken, checkRole(['researcher']), categoryController.updateCategory);
router.delete('/:id', authenticateToken, checkRole(['researcher']), categoryController.deleteCategory);

module.exports = router;
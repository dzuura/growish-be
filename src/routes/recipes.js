const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const recipeController = require('../controllers/recipeController');
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipes);
router.get('/my-recipes', authenticateToken, checkRole(['nutritionist']), recipeController.getMyRecipes);
router.get('/stats', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipeStats);
router.get('/:id', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipeById);
router.post('/', authenticateToken, checkRole(['nutritionist']), upload.single('image'), recipeController.createRecipe);
router.put('/:id', authenticateToken, checkRole(['nutritionist']), upload.single('image'), recipeController.updateRecipe);
router.delete('/:id', authenticateToken, checkRole(['nutritionist']), recipeController.deleteRecipe);

module.exports = router;
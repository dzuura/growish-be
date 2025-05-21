const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipes);
router.get('/my-recipes', authenticateToken, checkRole(['nutritionist']), recipeController.getMyRecipes);
router.get('/:id', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipeById);
router.get('/stats', authenticateToken, checkRole(['nutritionist']), recipeController.getRecipeStats);
router.post('/', authenticateToken, checkRole(['nutritionist']), recipeController.createRecipe);
router.put('/:id', authenticateToken, checkRole(['nutritionist']), recipeController.updateRecipe);
router.delete('/:id', authenticateToken, checkRole(['nutritionist']), recipeController.deleteRecipe);

module.exports = router;
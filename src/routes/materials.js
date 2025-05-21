const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/', authenticateToken, checkRole(['researcher', 'nutritionist']), materialController.getMaterials);
router.get('/my-materials', authenticateToken, checkRole(['researcher']), materialController.getMyMaterials);
router.get('/:id', authenticateToken, checkRole(['researcher', 'nutritionist']), materialController.getMaterialById);
router.get('/stats', authenticateToken, checkRole(['researcher']), materialController.getMaterialStats);
router.post('/', authenticateToken, checkRole(['researcher']), materialController.createMaterial);
router.put('/:id', authenticateToken, checkRole(['researcher']), materialController.updateMaterial);
router.delete('/:id', authenticateToken, checkRole(['researcher']), materialController.deleteMaterial);

module.exports = router;
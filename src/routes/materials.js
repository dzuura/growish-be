const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const materialController = require('../controllers/materialController');
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/', authenticateToken, checkRole(['researcher', 'nutritionist']), materialController.getMaterials);
router.get('/my-materials', authenticateToken, checkRole(['researcher']), materialController.getMyMaterials);
router.get('/stats', authenticateToken, checkRole(['researcher']), materialController.getMaterialStats);
router.get('/:id', authenticateToken, checkRole(['researcher', 'nutritionist']), materialController.getMaterialById);
router.post('/', authenticateToken, checkRole(['researcher']), upload.single('image'), materialController.createMaterial);
router.put('/:id', authenticateToken, checkRole(['researcher']), upload.single('image'), materialController.updateMaterial);
router.delete('/:id', authenticateToken, checkRole(['researcher']), materialController.deleteMaterial);

module.exports = router;
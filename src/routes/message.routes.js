const express = require('express');
const messageController = require('../controllers/messageController');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

// Publico (cliente / oyente sin login)
router.post('/', messageController.create);
router.get('/public/recent', messageController.recentPublic);

// Privado (admin + presentador)
router.get('/', authRequired, messageController.list);
router.get('/stats', authRequired, messageController.stats);

router.patch('/:id/priority', authRequired, roleRequired('admin'), messageController.updatePriority);
router.patch('/:id/status', authRequired, roleRequired('admin', 'presentador'), messageController.setStatus);
router.patch('/:id/read', authRequired, roleRequired('admin', 'presentador'), messageController.markAsRead);

router.delete('/:id', authRequired, roleRequired('admin'), messageController.remove);

module.exports = router;

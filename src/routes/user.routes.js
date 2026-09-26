const express = require('express');
const userController = require('../controllers/userController');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, roleRequired('admin'), userController.list);
router.post('/', authRequired, roleRequired('admin'), userController.create);
router.patch('/:id', authRequired, roleRequired('admin'), userController.update);
router.delete('/:id', authRequired, roleRequired('admin'), userController.remove);

module.exports = router;

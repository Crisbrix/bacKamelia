const express = require('express');
const authRoutes = require('./auth.routes');
const messageRoutes = require('./message.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'rancho-kamelia-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);

module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const { getUserById, getNearbyUsers, rateUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/nearby', getNearbyUsers);
router.get('/:id', getUserById);
router.post('/:id/rate', rateUser);

module.exports = router;

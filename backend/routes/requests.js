// routes/requests.js
const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  respondToRequest,
  getMyRequests,
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.use(protect); // All request routes require auth

router.route('/').get(getRequests).post(createRequest);
router.get('/my', getMyRequests);
router.route('/:id').get(getRequestById).put(updateRequest).delete(deleteRequest);
router.post('/:id/respond', respondToRequest);

module.exports = router;

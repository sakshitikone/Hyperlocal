// controllers/userController.js — User profiles, ratings, nearby users
const User = require('../models/User');

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nearby users
// @route   GET /api/users/nearby
// @access  Private
const getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id }, // Exclude current user
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    })
      .select('name avatar rating isVerified isOnline lastSeen location.address')
      .limit(20);

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate a user
// @route   POST /api/users/:id/rate
// @access  Private
const rateUser = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot rate yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Recalculate average rating
    const newCount = user.rating.count + 1;
    const newAverage = ((user.rating.average * user.rating.count) + parseInt(rating)) / newCount;

    user.rating = { average: parseFloat(newAverage.toFixed(1)), count: newCount };
    await user.save();

    res.json({ success: true, rating: user.rating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserById, getNearbyUsers, rateUser };

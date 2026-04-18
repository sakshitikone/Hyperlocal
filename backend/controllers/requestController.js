// controllers/requestController.js — CRUD and geospatial query for requests
const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const { title, description, category, urgency, lat, lng, address } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required' });
    }

    const request = await Request.create({
      user: req.user._id,
      title,
      description,
      category,
      urgency: urgency || 'normal',
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address: address || '',
      },
    });

    await request.populate('user', 'name avatar rating isVerified');

    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all requests (with optional geo filtering)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, urgency, category, status = 'open' } = req.query;

    let query = { status };

    // Urgency filter
    if (urgency && urgency !== 'all') {
      query.urgency = urgency;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    let requests;

    if (lat && lng) {
      // Geospatial query — find requests within radius (meters)
      requests = await Request.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      })
        .populate('user', 'name avatar rating isVerified')
        .limit(50);
    } else {
      // No location — return recent requests
      requests = await Request.find(query)
        .populate('user', 'name avatar rating isVerified')
        .sort({ urgency: -1, createdAt: -1 })
        .limit(50);
    }

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('user', 'name avatar rating isVerified location')
      .populate('respondents', 'name avatar rating')
      .populate('fulfilledBy', 'name avatar');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update request status or details
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only owner can edit
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
    }

    const updated = await Request.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'name avatar rating isVerified');

    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await request.deleteOne();
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to a request (volunteer to help)
// @route   POST /api/requests/:id/respond
// @access  Private
const respondToRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot respond to your own request' });
    }

    // Add user to respondents if not already there
    if (!request.respondents.includes(req.user._id)) {
      request.respondents.push(req.user._id);
      request.status = 'in-progress';
      await request.save();
    }

    res.json({ success: true, message: 'Response recorded', request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get requests by current user
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .populate('user', 'name avatar rating isVerified')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  respondToRequest,
  getMyRequests,
};

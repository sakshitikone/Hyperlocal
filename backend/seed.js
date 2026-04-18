// backend/seed.js — Populate MongoDB with sample users + requests
// Usage: node seed.js
require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const User      = require('./models/User');
const Request   = require('./models/Request');
const Message   = require('./models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hyperlocal';

// ── Sample data ──────────────────────────────────────
// Mumbai coords cluster — simulate a campus
const USERS = [
  { name: 'Aryan Sharma',   email: 'aryan@test.com',   password: 'password123', lat: 19.0760, lng: 72.8777, bio: 'CS final year. Love helping out!' },
  { name: 'Priya Mehta',    email: 'priya@test.com',   password: 'password123', lat: 19.0770, lng: 72.8790, bio: 'Biotech student. Ask me for lab help.' },
  { name: 'Rahul Gupta',    email: 'rahul@test.com',   password: 'password123', lat: 19.0755, lng: 72.8765, bio: 'Always have extra food to share 🍱' },
  { name: 'Sneha Patil',    email: 'sneha@test.com',   password: 'password123', lat: 19.0780, lng: 72.8800, bio: 'MBA student. Networking queen.' },
  { name: 'Dev Krishnan',   email: 'dev@test.com',     password: 'password123', lat: 19.0745, lng: 72.8755, bio: 'Have a car. Happy to give rides.' },
];

const seedRequests = (userIds) => [
  {
    user:        userIds[0],
    title:       'Need a laptop charger for 2 hours',
    description: 'My MacBook charger broke. I have a presentation in 3 hours and desperately need a USB-C charger. Can return it at the library entrance.',
    category:    'item',
    urgency:     'urgent',
    location:    { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Library Block A' },
    status:      'open',
  },
  {
    user:        userIds[1],
    title:       'Sharing homemade lunch today',
    description: 'Made extra dal rice and sabzi. First 3 people get a free home-cooked meal. Come to hostel D room 204 between 1-2pm.',
    category:    'food',
    urgency:     'normal',
    location:    { type: 'Point', coordinates: [72.8790, 19.0770], address: 'Hostel D' },
    status:      'open',
  },
  {
    user:        userIds[2],
    title:       'Ride needed to airport - Thursday 6am',
    description: 'Flying home this Thursday. Need a cab-share to airport. Can split cost. Luggage: 1 large bag.',
    category:    'transport',
    urgency:     'normal',
    location:    { type: 'Point', coordinates: [72.8765, 19.0755], address: 'Gate 2 Pickup' },
    status:      'open',
  },
  {
    user:        userIds[3],
    title:       'Python help needed for ML assignment',
    description: 'Stuck on implementing gradient descent from scratch. Have been debugging for 3 hours. Anyone who knows numpy well please help!',
    category:    'study',
    urgency:     'urgent',
    location:    { type: 'Point', coordinates: [72.8800, 19.0780], address: 'Study Hall 2' },
    status:      'open',
  },
  {
    user:        userIds[4],
    title:       'Umbrella available to borrow',
    description: 'Large golf umbrella available to borrow for the day. Pick up from Sports Block, locker 42. Just message me first.',
    category:    'item',
    urgency:     'normal',
    location:    { type: 'Point', coordinates: [72.8755, 19.0745], address: 'Sports Block' },
    status:      'open',
  },
  {
    user:        userIds[0],
    title:       'Looking for someone to proofread my SOP',
    description: 'Applying for MS abroad. Need someone with good English to review my Statement of Purpose (2 pages). Will return the favour!',
    category:    'help',
    urgency:     'normal',
    location:    { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Academic Block' },
    status:      'in-progress',
    respondents: [userIds[2]],
  },
];

const seedMessages = (userIds) => [
  { sender: userIds[0], receiver: userIds[1], content: 'Hi! Is the food offer still open?' },
  { sender: userIds[1], receiver: userIds[0], content: 'Yes! Come to hostel D before 2pm 🙂' },
  { sender: userIds[0], receiver: userIds[1], content: 'On my way, thank you so much!' },
  { sender: userIds[2], receiver: userIds[3], content: 'I can help with your Python assignment. What part is stuck?' },
  { sender: userIds[3], receiver: userIds[2], content: 'The backward pass is giving NaN values. Mind if we meet in study hall?' },
];

// ── Seed function ────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Request.deleteMany(), Message.deleteMany()]);
    console.log('🗑  Cleared existing data');

    // Create users (password hashing is done in User.pre('save'))
    const createdUsers = await Promise.all(
      USERS.map((u) =>
        User.create({
          name:     u.name,
          email:    u.email,
          password: u.password,
          bio:      u.bio,
          location: { type: 'Point', coordinates: [u.lng, u.lat], address: u.bio },
          rating:   { average: (Math.random() * 2 + 3).toFixed(1), count: Math.floor(Math.random() * 20) + 1 },
          isVerified: Math.random() > 0.5,
        })
      )
    );
    console.log(`👤 Created ${createdUsers.length} users`);

    const userIds = createdUsers.map((u) => u._id);

    // Create requests
    const reqs = await Request.insertMany(seedRequests(userIds));
    console.log(`📋 Created ${reqs.length} requests`);

    // Create messages
    const msgs = await Message.insertMany(seedMessages(userIds));
    console.log(`💬 Created ${msgs.length} messages`);

    console.log('\n🎉 Seed complete! Test credentials:');
    USERS.forEach((u) => console.log(`   ${u.email} / ${u.password}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();

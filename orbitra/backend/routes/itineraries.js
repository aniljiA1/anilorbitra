const express = require('express');
const {
  uploadAndGenerate,
  getMyItineraries,
  getItinerary,
  getStatus,
  deleteItinerary,
  shareItinerary,
  unshareItinerary,
  getSharedItinerary,
} = require('../controllers/itineraryController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/shared/:token', getSharedItinerary);

// Protected routes
router.use(protect);

router.post('/upload', upload.array('documents', 5), uploadAndGenerate);
router.get('/', getMyItineraries);
router.get('/:id', getItinerary);
router.get('/:id/status', getStatus);
router.delete('/:id', deleteItinerary);
router.post('/:id/share', shareItinerary);
router.post('/:id/unshare', unshareItinerary);

module.exports = router;

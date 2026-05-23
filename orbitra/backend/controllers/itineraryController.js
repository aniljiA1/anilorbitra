const path = require('path');
const Itinerary = require('../models/Itinerary');
const { extractTextFromFile, cleanText, deleteFile } = require('../utils/extractor');
const { extractBookingData, generateItinerary, generateFromRawText } = require('../utils/aiService');

/**
 * @route   POST /api/itineraries/upload
 * @desc    Upload travel documents and generate itinerary
 * @access  Private
 */
const uploadAndGenerate = async (req, res, next) => {
  const uploadedFiles = req.files || [];
  const filePaths = uploadedFiles.map((f) => f.path);

  try {
    if (!uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one travel document',
      });
    }

    // Create a placeholder itinerary while processing
    const itinerary = await Itinerary.create({
      user: req.user._id,
      title: 'Processing your itinerary...',
      status: 'processing',
      uploads: uploadedFiles.map((f) => ({
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      })),
    });

    // Respond immediately with itinerary ID so frontend can poll
    res.status(202).json({
      success: true,
      message: 'Documents uploaded. Generating itinerary...',
      itineraryId: itinerary._id,
    });

    // Process in background
    processItinerary(itinerary._id, uploadedFiles, filePaths).catch((err) => {
      console.error('Background processing error:', err);
    });
  } catch (error) {
    // Cleanup files on error
    filePaths.forEach(deleteFile);
    next(error);
  }
};

/**
 * Background processing: extract text, call AI, update itinerary
 */
const processItinerary = async (itineraryId, uploadedFiles, filePaths) => {
  try {
    // Step 1: Extract text from all files
    const extractionResults = await Promise.allSettled(
      uploadedFiles.map((file, i) =>
        extractTextFromFile(filePaths[i], file.mimetype)
      )
    );

    const rawTexts = extractionResults
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => cleanText(r.value));

    if (!rawTexts.length) {
      await Itinerary.findByIdAndUpdate(itineraryId, {
        status: 'failed',
        errorMessage: 'Could not extract text from uploaded documents. Please ensure files are readable.',
      });
      return;
    }

    // Step 2: Extract structured booking data
    let extractedData = [];
    try {
      extractedData = await extractBookingData(rawTexts);
    } catch (err) {
      console.warn('Structured extraction failed, using raw text:', err.message);
    }

    // Step 3: Generate itinerary
    let generatedData;
    try {
      if (extractedData.length > 0) {
        generatedData = await generateItinerary(extractedData);
      } else {
        generatedData = await generateFromRawText(rawTexts);
      }
    } catch (err) {
      await Itinerary.findByIdAndUpdate(itineraryId, {
        status: 'failed',
        errorMessage: `AI generation failed: ${err.message}`,
      });
      return;
    }

    // Step 4: Save completed itinerary
    await Itinerary.findByIdAndUpdate(itineraryId, {
      title: generatedData.title || 'My Travel Itinerary',
      destination: generatedData.destination,
      startDate: generatedData.startDate,
      endDate: generatedData.endDate,
      duration: generatedData.duration,
      travelers: generatedData.travelers || 1,
      summary: generatedData.summary,
      days: generatedData.days || [],
      tips: generatedData.tips || [],
      emergencyInfo: generatedData.emergencyInfo,
      tags: generatedData.tags || [],
      extractedData,
      status: 'completed',
    });
  } catch (error) {
    console.error('Processing error:', error);
    await Itinerary.findByIdAndUpdate(itineraryId, {
      status: 'failed',
      errorMessage: error.message,
    }).catch(() => {});
  } finally {
    // Always cleanup uploaded files
    filePaths.forEach(deleteFile);
  }
};

/**
 * @route   GET /api/itineraries
 * @desc    Get all itineraries for logged-in user
 * @access  Private
 */
const getMyItineraries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      Itinerary.find({ user: req.user._id })
        .select('-days -extractedData')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Itinerary.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      itineraries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/itineraries/:id
 * @desc    Get single itinerary by ID
 * @access  Private
 */
const getItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    res.json({ success: true, itinerary });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/itineraries/:id/status
 * @desc    Poll itinerary processing status
 * @access  Private
 */
const getStatus = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('status errorMessage title destination');

    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, status: itinerary.status, itinerary });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/itineraries/:id
 * @desc    Delete an itinerary
 * @access  Private
 */
const deleteItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    res.json({ success: true, message: 'Itinerary deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/itineraries/:id/share
 * @desc    Enable sharing for an itinerary
 * @access  Private
 */
const shareItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (!itinerary.isShared) {
      itinerary.isShared = true;
      itinerary.sharedAt = new Date();
      await itinerary.save();
    }

    const shareUrl = `${process.env.FRONTEND_URL}/shared/${itinerary.shareToken}`;

    res.json({
      success: true,
      shareToken: itinerary.shareToken,
      shareUrl,
      message: 'Itinerary is now shareable',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/itineraries/:id/unshare
 * @desc    Disable sharing for an itinerary
 * @access  Private
 */
const unshareItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isShared: false, sharedAt: null },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, message: 'Sharing disabled' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/shared/:token
 * @desc    View shared itinerary (public)
 * @access  Public
 */
const getSharedItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOne({
      shareToken: req.params.token,
      isShared: true,
      status: 'completed',
    }).populate('user', 'name');

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Shared itinerary not found or no longer available',
      });
    }

    res.json({ success: true, itinerary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAndGenerate,
  getMyItineraries,
  getItinerary,
  getStatus,
  deleteItinerary,
  shareItinerary,
  unshareItinerary,
  getSharedItinerary,
};

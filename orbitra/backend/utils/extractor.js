const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

/**
 * Extract text from a PDF file
 */
const extractFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract text from an image using OCR
 */
const extractFromImage = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: () => {}, // suppress logs
    });
    return result.data.text || '';
  } catch (error) {
    console.error('OCR extraction error:', error.message);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Extract text from uploaded file based on mime type
 */
const extractTextFromFile = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return await extractFromPDF(filePath);
  } else if (
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(
      mimeType
    )
  ) {
    return await extractFromImage(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
};

/**
 * Clean and normalize extracted text
 */
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
};

/**
 * Delete file after processing
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File deletion error:', error.message);
  }
};

module.exports = {
  extractTextFromFile,
  cleanText,
  deleteFile,
};

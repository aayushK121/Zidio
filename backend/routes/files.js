import express from 'express';
import multer from 'multer';
import File from '../models/File.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Always save to backend/uploads
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 10485760 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /xlsx|xls/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only Excel files are allowed!');
    }
  }
});

// Upload file route
router.post('/upload', authenticateToken, (req, res, next) => {
  console.log('Upload route hit');
  next();
}, upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file);

    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id
    });

    await file.save();

    res.status(201).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// File listing route
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ message: 'Server error while retrieving files' });
  }
});

// Download file route
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const filePath = path.join(__dirname, '..', file.path);
    res.download(filePath, file.originalName, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }

      await file.incrementDownloadCount();
    });
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ message: 'Server error during file download' });
  }
});

export default router;

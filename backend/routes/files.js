import express from 'express';
import multer from 'multer';
import File from '../models/File.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx'; // Add this at the top if not already present

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

    // Auto-generate charts for this file
    try {
      // Import Chart and XLSX here to avoid circular dependencies
      const Chart = (await import('../models/Chart.js')).default;
      const XLSX = (await import('xlsx')).default;
      const path = (await import('path')).default;
      const filePath = file.path;
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (json.length >= 2) {
        const headers = json[0];
        const rows = json.slice(1);
        // Find all numeric columns
        const numericIndices = [];
        for (let i = 0; i < headers.length; i++) {
          if (typeof rows[0][i] === 'number') {
            numericIndices.push(i);
          }
        }
        if (numericIndices.length >= 2) {
          const xIdx = numericIndices[0];
          const yIdx = numericIndices[1];
          const chartTypes = ['bar', 'line', 'pie'];
          for (const chartType of chartTypes) {
            const existing = await Chart.findOne({ sourceFile: file._id, createdBy: req.user._id, chartType });
            if (existing) continue;
            let chartConfig;
            if (chartType === 'pie') {
              chartConfig = {
                labels: rows.map(r => r[xIdx]),
                datasets: [{
                  label: headers[yIdx],
                  data: rows.map(r => r[yIdx]),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                  ],
                  borderWidth: 1
                }]
              };
            } else {
              chartConfig = {
                labels: rows.map(r => r[xIdx]),
                datasets: [{
                  label: headers[yIdx],
                  data: rows.map(r => r[yIdx]),
                  backgroundColor: chartType === 'bar' ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
                  borderColor: chartType === 'bar' ? 'rgba(53, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
                  borderWidth: 1,
                  fill: chartType === 'line' ? false : undefined
                }]
              };
            }
            const chart = new Chart({
              title: `${file.originalName} - ${headers[yIdx]} vs ${headers[xIdx]} (${chartType})`,
              description: `Auto-generated ${chartType} chart from ${file.originalName}`,
              chartType,
              chartConfig,
              sourceFile: file._id,
              createdBy: req.user._id,
              isPublic: false,
              tags: [headers[xIdx], headers[yIdx]]
            });
            await chart.save();
          }
        }
      }
    } catch (chartGenErr) {
      console.error('Chart auto-generation error after upload:', chartGenErr);
    }

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

    // Handle the file path correctly - file.path is already the full path from multer
    const filePath = file.path;
    res.download(filePath, file.originalName, async (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'File download failed' });
        }
        return;
      }

      try {
        await file.incrementDownloadCount();
      } catch (dbErr) {
        console.error('Failed to update download count:', dbErr);
      }
    });
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ message: 'Server error during file download' });
  }
});

// Delete file route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    // Delete the physical file from filesystem
    const fs = await import('fs');
    const filePath = file.path; // file.path is already the full path from multer
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the database record
    await File.findByIdAndDelete(req.params.id);

    // Also delete any charts associated with this file
    const Chart = (await import('../models/Chart.js')).default;
    await Chart.deleteMany({ sourceFile: req.params.id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
});

// Get columns (headers) for a file
router.get('/:id/columns', authenticateToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }
    const filePath = file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length < 1) {
      return res.status(200).json({ columns: [] });
    }
    const headers = json[0];
    res.status(200).json({ columns: headers });
  } catch (error) {
    console.error('Get columns error:', error);
    res.status(500).json({ message: 'Failed to get columns' });
  }
});

export default router;

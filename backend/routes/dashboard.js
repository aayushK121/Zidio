import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import File from '../models/File.js';
import Chart from '../models/Chart.js';

const router = express.Router();

// Dashboard route
router.get('/', authenticateToken, async (req, res) => {
  try {
    const fileCount = await File.countDocuments({ uploadedBy: req.user._id });
    const chartCount = await Chart.countDocuments({ createdBy: req.user._id });

    const recentFiles = await File.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(5);
    const recentCharts = await Chart.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      fileCount,
      chartCount,
      recentFiles,
      recentCharts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error while loading dashboard' });
  }
});

export default router;

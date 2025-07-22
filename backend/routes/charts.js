import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import File from '../models/File.js';
import Chart from '../models/Chart.js';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// List all charts for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Find all charts created by the user
    const charts = await Chart.find({ createdBy: req.user._id }).populate('sourceFile');
    res.status(200).json(charts);
  } catch (error) {
    console.error('Chart list error:', error);
    res.status(500).json({ message: 'Server error while retrieving charts' });
  }
});

// Auto-generate a chart for each uploaded file if no chart exists
router.post('/autogen', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id });
    let createdCharts = [];
    for (const file of files) {
      const existing = await Chart.findOne({ sourceFile: file._id, createdBy: req.user._id });
      if (existing) continue;
      // Only process Excel files
      if (!file.mimetype.includes('excel')) continue;
      const filePath = path.join(__dirname, '../', file.path);
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) continue;
        const headers = json[0];
        const rows = json.slice(1);
        // Find first two columns with numeric data
        let xIdx = 0, yIdx = 1;
        for (let i = 0; i < headers.length; i++) {
          if (typeof rows[0][i] === 'number') {
            xIdx = i;
            break;
          }
        }
        for (let i = xIdx + 1; i < headers.length; i++) {
          if (typeof rows[0][i] === 'number') {
            yIdx = i;
            break;
          }
        }
        // Prepare chart data
        const chartType = 'bar';
        const chartConfig = {
          labels: rows.map(r => r[xIdx]),
          datasets: [{
            label: headers[yIdx],
            data: rows.map(r => r[yIdx]),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          }]
        };
        const chart = new Chart({
          title: `${file.originalName} - ${headers[yIdx]} vs ${headers[xIdx]}`,
          description: `Auto-generated bar chart from ${file.originalName}`,
          chartType,
          chartConfig,
          sourceFile: file._id,
          createdBy: req.user._id,
          isPublic: false,
          tags: [headers[xIdx], headers[yIdx]]
        });
        await chart.save();
        createdCharts.push(chart);
      } catch (err) {
        console.error('Excel parse error:', err);
      }
    }
    res.status(201).json({ message: 'Auto-generated charts', created: createdCharts.length });
  } catch (error) {
    console.error('Auto-generate chart error:', error);
    res.status(500).json({ message: 'Server error during chart auto-generation' });
  }
});

export default router; 
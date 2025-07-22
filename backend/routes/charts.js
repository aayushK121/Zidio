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
    const charts = await Chart.find({ createdBy: req.user._id });
    res.status(200).json(charts);
  } catch (error) {
    console.error('Chart list error:', error);
    res.status(500).json({ message: 'Server error while retrieving charts' });
  }
});

// Auto-generate a single chart for each uploaded file if no chart exists
router.post('/autogen', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id });
    let createdCharts = [];
    
    for (const file of files) {
      // Skip if chart already exists for this file
      const existing = await Chart.findOne({ sourceFile: file._id, createdBy: req.user._id });
      if (existing) continue;
      
      // Only process Excel files
      if (!file.mimetype.includes('excel') && !file.mimetype.includes('spreadsheetml')) continue;
      
      const filePath = file.path;
      
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (json.length < 2) {
          console.log(`Skipping file ${file.originalName}: Not enough data rows`);
          continue;
        }
        
        const headers = json[0];
        const rows = json.slice(1).filter(row => row && row.length > 0); // Filter empty rows
        
        if (rows.length === 0) {
          console.log(`Skipping file ${file.originalName}: No valid data rows`);
          continue;
        }
        
        // Find columns with mixed or numeric data
        const columnAnalysis = headers.map((header, index) => {
          const values = rows.map(row => row[index]).filter(val => val !== null && val !== undefined && val !== '');
          if (values.length === 0) return { index, header, type: 'empty', hasData: false };
          
          const numericCount = values.filter(val => typeof val === 'number' || !isNaN(Number(val))).length;
          const stringCount = values.filter(val => typeof val === 'string' && isNaN(Number(val))).length;
          
          return {
            index,
            header,
            numericCount,
            stringCount,
            totalValues: values.length,
            hasData: values.length > 0,
            type: numericCount > stringCount ? 'numeric' : 'categorical'
          };
        });
        
        // Find best columns for chart
        const categoricalColumns = columnAnalysis.filter(col => col.type === 'categorical' && col.hasData);
        const numericColumns = columnAnalysis.filter(col => col.type === 'numeric' && col.hasData);
        
        if (categoricalColumns.length === 0 || numericColumns.length === 0) {
          console.log(`Skipping file ${file.originalName}: Need at least one categorical and one numeric column`);
          continue;
        }
        
        // Use first categorical as X-axis and first numeric as Y-axis
        const xColumn = categoricalColumns[0];
        const yColumn = numericColumns[0];
        
        // Prepare clean data
        const cleanData = rows
          .map(row => ({
            x: row[xColumn.index],
            y: Number(row[yColumn.index]) || 0
          }))
          .filter(item => item.x !== null && item.x !== undefined && item.x !== '' && !isNaN(item.y))
          .slice(0, 20); // Limit to 20 data points for better visualization
        
        if (cleanData.length === 0) {
          console.log(`Skipping file ${file.originalName}: No valid data points after cleaning`);
          continue;
        }
        
        // Create chart configuration
        const chartConfig = {
          labels: cleanData.map(item => String(item.x)),
          datasets: [{
            label: yColumn.header || 'Values',
            data: cleanData.map(item => item.y),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          }]
        };
        
        const chart = new Chart({
          title: `${file.originalName} - ${yColumn.header} by ${xColumn.header}`,
          description: `Auto-generated bar chart from ${file.originalName}`,
          chartType: 'bar',
          chartConfig,
          sourceFile: file._id,
          createdBy: req.user._id,
          isPublic: false,
          tags: [xColumn.header, yColumn.header].filter(Boolean)
        });
        
        await chart.save();
        createdCharts.push(chart);
        console.log(`Created chart for file: ${file.originalName}`);
        
      } catch (err) {
        console.error(`Excel parse error for file ${file.originalName}:`, err.message);
      }
    }
    
    res.status(201).json({ 
      message: 'Auto-generated charts', 
      created: createdCharts.length,
      details: createdCharts.map(chart => ({ title: chart.title, id: chart._id }))
    });
  } catch (error) {
    console.error('Auto-generate chart error:', error);
    res.status(500).json({ message: 'Server error during chart auto-generation' });
  }
});

// Create a chart manually
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, chartType, sourceFile, xColumn, yColumn } = req.body;
    if (!title || !chartType || !sourceFile || !xColumn || !yColumn) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const file = await File.findById(sourceFile);
    if (!file || file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const filePath = file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (json.length < 2) {
      return res.status(400).json({ message: 'File does not contain enough data' });
    }
    
    const headers = json[0];
    const rows = json.slice(1).filter(row => row && row.length > 0); // Filter empty rows
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'File contains no valid data rows' });
    }

    const xIdx = headers.indexOf(xColumn);
    const yIdx = headers.indexOf(yColumn);
    if (xIdx === -1 || yIdx === -1) {
      return res.status(400).json({ message: 'Selected columns not found in file' });
    }

    // Clean and validate data
    const cleanData = rows
      .map(row => ({
        x: row[xIdx],
        y: chartType === 'pie' || chartType === 'doughnut' ? 
            (Number(row[yIdx]) || 0) : 
            (Number(row[yIdx]) || 0)
      }))
      .filter(item => {
        const hasValidX = item.x !== null && item.x !== undefined && item.x !== '';
        const hasValidY = !isNaN(item.y) && item.y !== null;
        return hasValidX && hasValidY;
      })
      .slice(0, 50); // Limit to 50 data points for performance
    
    if (cleanData.length === 0) {
      return res.status(400).json({ message: 'No valid data points found with selected columns' });
    }

    let chartConfig;
    if (chartType === 'pie' || chartType === 'doughnut') {
      // For pie charts, aggregate data by category
      const aggregatedData = cleanData.reduce((acc, item) => {
        const key = String(item.x);
        acc[key] = (acc[key] || 0) + item.y;
        return acc;
      }, {});
      
      const colors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(255, 99, 255, 0.5)',
        'rgba(99, 255, 132, 0.5)'
      ];
      
      chartConfig = {
        labels: Object.keys(aggregatedData),
        datasets: [{
          label: headers[yIdx],
          data: Object.values(aggregatedData),
          backgroundColor: colors.slice(0, Object.keys(aggregatedData).length),
          borderColor: colors.map(color => color.replace('0.5', '1')).slice(0, Object.keys(aggregatedData).length),
          borderWidth: 1
        }]
      };
    } else {
      chartConfig = {
        labels: cleanData.map(item => String(item.x)),
        datasets: [{
          label: headers[yIdx],
          data: cleanData.map(item => item.y),
          backgroundColor: chartType === 'bar' ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
          borderColor: chartType === 'bar' ? 'rgba(53, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          fill: chartType === 'line' ? false : undefined
        }]
      };
    }

    const Chart = (await import('../models/Chart.js')).default;
    const chart = new Chart({
      title,
      description,
      chartType,
      chartConfig,
      sourceFile: file._id,
      createdBy: req.user._id,
      isPublic: false,
      tags: [xColumn, yColumn]
    });
    await chart.save();

    res.status(201).json({ message: 'Chart created', chart });
  } catch (error) {
    console.error('Create chart error:', error);
    res.status(500).json({ message: 'Server error during chart creation' });
  }
});

// Delete chart route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const chart = await Chart.findById(req.params.id);

    if (!chart || chart.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Chart not found or access denied' });
    }

    await Chart.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Chart deleted successfully' });
  } catch (error) {
    console.error('Chart deletion error:', error);
    res.status(500).json({ message: 'Server error during chart deletion' });
  }
});

// Download chart as image (placeholder for now)
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const chart = await Chart.findById(req.params.id);

    if (!chart || chart.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Chart not found or access denied' });
    }

    // For now, return the chart data as JSON
    // In a production environment, you'd generate an image using a service like puppeteer
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${chart.title}.json"`);
    res.json({
      title: chart.title,
      description: chart.description,
      chartType: chart.chartType,
      chartConfig: chart.chartConfig,
      createdAt: chart.createdAt
    });
  } catch (error) {
    console.error('Chart download error:', error);
    res.status(500).json({ message: 'Server error during chart download' });
  }
});

export default router; 
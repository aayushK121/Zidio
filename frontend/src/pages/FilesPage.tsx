import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Eye,
  Calendar,
  HardDrive,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface FileItem {
  _id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedBy: string;
  createdAt: string;
  downloadCount: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

interface ChartData {
  _id?: string;
  title: string;
  description?: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  chartConfig: any;
  sourceFile: string;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [viewModal, setViewModal] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const { } = useAuth();

  // Fetch files
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const filesData = await response.json();
        setFiles(filesData);
      } else {
        setError('Failed to fetch files');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Files fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles);
    if (acceptedFiles.length === 0) {
      console.log('No accepted files');
      return;
    }
    
    setUploading(true);
    const file = acceptedFiles[0];
    console.log('Uploading file:', { name: file.name, size: file.size, type: file.type });
    
    const formData = new FormData();
    formData.append('excel', file);
    console.log('FormData prepared, making request to /api/files/upload');
    
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        setFiles(prev => [result.file, ...prev]);
        setError('');
        
        // Ask user if they want to create a chart for the uploaded file
        setTimeout(() => {
          if (window.confirm(`File uploaded successfully! Would you like to create a chart for "${result.file.originalName}"?`)) {
            handleView(result.file._id, result.file.originalName);
          }
        }, 500);
      } else {
        const errorData = await response.json();
        console.log('Upload failed with error:', errorData);
        setError(errorData.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  // Filter and sort files
  const filteredFiles = files
    .filter(file => 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.size - a.size;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleView = async (fileId: string, fileName: string) => {
    try {
      // First, check if chart already exists for this file
      const chartResponse = await fetch('/api/charts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (chartResponse.ok) {
        const charts = await chartResponse.json();
        const fileChart = charts.find((chart: ChartData) => chart.sourceFile === fileId);
        
        if (fileChart) {
          // Chart exists, show it
          setChartData(fileChart);
          setViewModal(true);
        } else {
          // No chart exists, offer to create one
          if (window.confirm(`No chart exists for "${fileName}". Would you like to create one?`)) {
            // Only now trigger chart auto-generation for this specific file
            const autogenResponse = await fetch('/api/charts/autogen', { 
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (autogenResponse.ok) {
              // Fetch the newly created chart
              const newChartResponse = await fetch('/api/charts', {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (newChartResponse.ok) {
                const newCharts = await newChartResponse.json();
                const newFileChart = newCharts.find((chart: ChartData) => chart.sourceFile === fileId);
                
                if (newFileChart) {
                  setChartData(newFileChart);
                  setViewModal(true);
                } else {
                  setError('Could not create chart for this file. The file may not contain valid data for visualization.');
                }
              } else {
                setError('Failed to fetch newly created chart');
              }
            } else {
              const errorData = await autogenResponse.json();
              setError(errorData.message || 'Failed to generate chart. The file may not contain valid data for visualization.');
            }
          }
        }
      } else {
        setError('Failed to check for existing charts');
      }
    } catch (err) {
      console.error('View error:', err);
      setError('An error occurred while viewing the file');
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone and will also delete any associated charts.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file._id !== fileId));
        setError('');
        // File deleted successfully
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete file');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    maintainAspectRatio: false,
  };

  const pieOptions: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    maintainAspectRatio: false,
  };

  const renderChart = (chart: ChartData, height = '300px') => {
    if (!chart || !chart.chartConfig) {
      return <div className="text-red-500 text-center p-4">No chart data available</div>;
    }
    
    if (!chart.chartConfig.labels || !chart.chartConfig.datasets || 
        !Array.isArray(chart.chartConfig.labels) || !Array.isArray(chart.chartConfig.datasets)) {
      return <div className="text-red-500 text-center p-4">Invalid chart data format</div>;
    }
    
    if (chart.chartConfig.labels.length === 0 || chart.chartConfig.datasets.length === 0) {
      return <div className="text-gray-500 text-center p-4">No data to display</div>;
    }
    
    const baseData = chart.chartConfig;

    switch (chart.chartType) {
      case 'bar':
        return <Bar data={baseData} options={chartOptions as any} height={height} />;
      case 'line':
        return <Line data={baseData} options={chartOptions as any} height={height} />;
      case 'pie':
        return <Pie data={baseData} options={pieOptions as any} height={height} />;
      case 'doughnut':
        return <Doughnut data={baseData} options={pieOptions as any} height={height} />;
      default:
        return <Bar data={baseData} options={chartOptions as any} height={height} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
        <p className="text-gray-600 mt-2">
          Upload, manage, and analyze your Excel files
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div className="space-y-4">
          {/* Upload Button */}
          <div className="text-center">
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={uploading}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-5 w-5" />
              {uploading ? 'Uploading...' : 'Upload Excel File'}
            </button>
            <input
              id="file-input"
              {...getInputProps()}
              style={{ display: 'none' }}
            />
          </div>
          
          {/* Drag and Drop Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {uploading ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Uploading...</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive 
                    ? 'Drop your Excel file here...' 
                    : 'Or drag & drop an Excel file here'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports .xlsx and .xls files (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No files found' : 'No files uploaded yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Upload your first Excel file to get started'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredFiles.map((file) => (
              <div key={file._id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center flex-1">
                  <FileText className="h-8 w-8 text-green-500 mr-4" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {file.originalName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        {file.downloadCount} downloads
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    file.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : file.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : file.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {file.status}
                  </span>
                  <button
                    onClick={() => handleDownload(file._id, file.originalName)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleView(file._id, file.originalName)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file._id, file.originalName)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">{files.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-semibold text-gray-900">
                {files.reduce((acc, file) => acc + file.downloadCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart View Modal */}
      {viewModal && chartData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{chartData.title}</h2>
                  {chartData.description && (
                    <p className="text-gray-600 mt-1">{chartData.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setViewModal(false);
                    setChartData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-96 mb-6 bg-gray-50 rounded-lg p-4">
                {renderChart(chartData, '380px')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Chart Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Type:</dt>
                      <dd className="text-sm text-gray-900 capitalize">{chartData.chartType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Created:</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(chartData.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Views:</dt>
                      <dd className="text-sm text-gray-900">{chartData.viewCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Visibility:</dt>
                      <dd className="text-sm text-gray-900">
                        {chartData.isPublic ? 'Public' : 'Private'}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {chartData.tags && chartData.tags.length > 0 ? (
                      chartData.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No tags</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewModal(false);
                    setChartData(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to charts page or implement chart download
                    window.open(`/charts`, '_blank');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View in Charts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesPage;

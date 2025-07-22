import React, { useState, useEffect } from 'react';
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
import {
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

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

interface ChartItem {
  _id: string;
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

interface FileItem {
  _id: string;
  originalName: string;
  filename: string;
}

const ChartsPage: React.FC = () => {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartItem | null>(null);
  const { user } = useAuth();

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

  // Fetch charts and files
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Auto-generate charts for all uploaded files
        await fetch('/api/charts/autogen', { method: 'POST', headers });

        // Fetch charts
        const chartsResponse = await fetch('/api/charts', { headers });
        if (chartsResponse.ok) {
          const chartsData = await chartsResponse.json();
          setCharts(chartsData);
        } else {
          setError('Failed to load charts');
        }

        // Fetch files (for statistics)
        const filesResponse = await fetch('/api/files/list', { headers });
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Charts fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter and search charts
  const filteredCharts = charts
    .filter(chart => {
      const matchesSearch = chart.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           chart.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || chart.chartType === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'line': return <LineChart className="h-5 w-5" />;
      case 'pie':
      case 'doughnut': return <PieChart className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  const renderChart = (chart: ChartItem, height = '200px') => {
    const chartProps = {
      data: chart.chartConfig,
      options: chart.chartType === 'pie' || chart.chartType === 'doughnut' ? pieOptions : chartOptions,
      height
    };

    switch (chart.chartType) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Charts & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your data visualizations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Chart
        </button>
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
            placeholder="Search charts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="bar">Bar Charts</option>
            <option value="line">Line Charts</option>
            <option value="pie">Pie Charts</option>
            <option value="doughnut">Doughnut Charts</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      {filteredCharts.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No charts found' : 'No charts created yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first chart to get started with data visualization'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Create Your First Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map((chart) => (
            <div key={chart._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Chart Preview */}
              <div className="p-4 bg-gray-50">
                <div className="h-48 w-full">
                  {renderChart(chart, '190px')}
                </div>
              </div>
              
              {/* Chart Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getChartIcon(chart.chartType)}
                    <h3 className="font-medium text-gray-900">{chart.title}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    chart.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {chart.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                {chart.description && (
                  <p className="text-sm text-gray-600 mb-3">{chart.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(chart.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {chart.viewCount} views
                  </span>
                </div>
                
                {/* Tags */}
                {chart.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {chart.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Chart Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedChart(chart)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 rounded transition-colors"
                    title="Edit Chart"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded transition-colors"
                    title="Share Chart"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded transition-colors"
                    title="Download Chart"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200 rounded transition-colors"
                    title="Delete Chart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Charts</p>
              <p className="text-2xl font-semibold text-gray-900">{charts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">
                {charts.reduce((acc, chart) => acc + chart.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Public Charts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {charts.filter(chart => chart.isPublic).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <LineChart className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Sources</p>
              <p className="text-2xl font-semibold text-gray-900">{files.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Detail Modal */}
      {selectedChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedChart.title}</h2>
                  {selectedChart.description && (
                    <p className="text-gray-600 mt-1">{selectedChart.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedChart(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="h-96 mb-6">
                {renderChart(selectedChart, '380px')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Chart Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Type:</dt>
                      <dd className="text-sm text-gray-900 capitalize">{selectedChart.chartType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Source:</dt>
                      <dd className="text-sm text-gray-900">{selectedChart.sourceFile}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Created:</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedChart.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Views:</dt>
                      <dd className="text-sm text-gray-900">{selectedChart.viewCount}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedChart.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsPage;

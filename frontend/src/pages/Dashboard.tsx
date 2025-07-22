import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart3, FileText, TrendingUp, Users } from 'lucide-react';

interface DashboardData {
  fileCount: number;
  chartCount: number;
  recentFiles: any[];
  recentCharts: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your Excel analytics workspace.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.fileCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Charts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.chartCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analytics</p>
              <p className="text-2xl font-semibold text-gray-900">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Account</p>
              <p className="text-2xl font-semibold text-gray-900">Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Files</h3>
          {data?.recentFiles && data.recentFiles.length > 0 ? (
            <div className="space-y-3">
              {data.recentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No files uploaded yet</p>
          )}
        </div>

        {/* Recent Charts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Charts</h3>
          {data?.recentCharts && data.recentCharts.length > 0 ? (
            <div className="space-y-3">
              {data.recentCharts.map((chart, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {chart.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(chart.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {chart.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No charts created yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => navigate('/files')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Upload Excel File
          </button>
          <button 
            onClick={() => navigate('/charts')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create Chart
          </button>
          <button 
            onClick={() => navigate('/charts')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

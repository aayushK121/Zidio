import React, { useState } from 'react';
import {
  User,
  Settings,
  Shield,
  Bell,
  Eye,
  Lock,
  Save,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form states
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    company: user?.profile?.company || '',
    department: user?.profile?.department || ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }

    if (securityData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Password changed successfully!');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Preferences updated successfully!');
    } catch (error) {
      setMessage('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        logout();
      } catch (error) {
        setMessage('Failed to delete account. Please try again.');
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );
        
      case 'security':
        return (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-blue-800 text-sm">
                  Choose a strong password with at least 8 characters including numbers and special characters.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={securityData.newPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
                  <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.weeklyReports}
                    onChange={(e) => setPreferences(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                  <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketingEmails}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Data Usage</h3>
              <p className="text-sm text-gray-600 mb-4">
                We collect and process your data to provide the Excel Analytics Platform services. 
                Your data is encrypted and stored securely.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File uploads are processed for analytics</li>
                <li>• Usage statistics help improve the platform</li>
                <li>• Personal information is never shared with third parties</li>
                <li>• You can delete your data at any time</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Privacy Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Control who can see your profile information</p>
                  </div>
                  <select className="border border-gray-300 rounded px-3 py-1">
                    <option>Private</option>
                    <option>Public</option>
                    <option>Organization Only</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Analytics Tracking</p>
                    <p className="text-sm text-gray-500">Allow usage analytics to improve the platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'danger':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm font-medium">
                  Danger Zone - These actions cannot be undone
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Delete All Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete all your uploaded files, charts, and analytics data. This action cannot be undone.
                </p>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Delete All Data
                </button>
              </div>
              
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('successfully') || message.includes('Success')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

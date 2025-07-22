import React, { useState } from 'react';

interface FileItem {
  _id: string;
  originalName: string;
}

interface CreateChartModalProps {
  files: FileItem[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    sourceFile: string;
    xColumn: string;
    yColumn: string;
  }) => void;
}

const chartTypes = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
];

const CreateChartModal: React.FC<CreateChartModalProps> = ({ files, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [sourceFile, setSourceFile] = useState(files[0]?._id || '');
  const [columns, setColumns] = useState<string[]>([]);
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [loadingCols, setLoadingCols] = useState(false);
  const [error, setError] = useState('');

  // Fetch columns for selected file
  const fetchColumns = async (fileId: string) => {
    setLoadingCols(true);
    setColumns([]);
    setXColumn('');
    setYColumn('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/files/${fileId}/columns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setColumns(data.columns || []);
      } else {
        setError('Failed to fetch columns');
      }
    } catch (err) {
      setError('Failed to fetch columns');
    } finally {
      setLoadingCols(false);
    }
  };

  React.useEffect(() => {
    if (sourceFile) {
      fetchColumns(sourceFile);
    }
    // eslint-disable-next-line
  }, [sourceFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sourceFile || !xColumn || !yColumn) {
      setError('Please fill all required fields');
      return;
    }
    onCreate({ title, description, chartType, sourceFile, xColumn, yColumn });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Chart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chart Type *</label>
            <select className="w-full border rounded px-3 py-2" value={chartType} onChange={e => setChartType(e.target.value as any)} required>
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source File *</label>
            <select className="w-full border rounded px-3 py-2" value={sourceFile} onChange={e => setSourceFile(e.target.value)} required>
              {files.map(file => (
                <option key={file._id} value={file._id}>{file.originalName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">X Column *</label>
            <select className="w-full border rounded px-3 py-2" value={xColumn} onChange={e => setXColumn(e.target.value)} required disabled={loadingCols || columns.length === 0}>
              <option value="">Select X column</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Y Column *</label>
            <select className="w-full border rounded px-3 py-2" value={yColumn} onChange={e => setYColumn(e.target.value)} required disabled={loadingCols || columns.length === 0}>
              <option value="">Select Y column</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChartModal; 
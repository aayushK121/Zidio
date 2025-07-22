export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    department?: string;
    company?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface File {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: string;
  processedData?: {
    headers: string[];
    rowCount: number;
    sheets: {
      name: string;
      headers: string[];
      rowCount: number;
    }[];
    dataPreview: any[];
    metadata: {
      hasHeaders: boolean;
      encoding?: string;
      createdDate?: string;
      modifiedDate?: string;
    };
  };
  status: 'uploading' | 'processing' | 'completed' | 'error';
  processingError?: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
  downloadCount: number;
  lastAccessed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chart {
  _id: string;
  title: string;
  description?: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'column';
  chartConfig: {
    labels: string[];
    datasets: any[];
  };
  sourceFile: string;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  viewCount: number;
  lastViewed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface DashboardStats {
  fileCount: number;
  chartCount: number;
  recentFiles: File[];
  recentCharts: Chart[];
}

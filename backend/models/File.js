import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedData: {
    headers: [String],
    rowCount: {
      type: Number,
      default: 0
    },
    sheets: [{
      name: String,
      headers: [String],
      rowCount: Number
    }],
    dataPreview: [mongoose.Schema.Types.Mixed], // First few rows for preview
    metadata: {
      hasHeaders: {
        type: Boolean,
        default: true
      },
      encoding: String,
      createdDate: Date,
      modifiedDate: Date
    }
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'error'],
    default: 'uploading'
  },
  processingError: String,
  tags: [String],
  description: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: Date
}, {
  timestamps: true
});

// Indexes for better query performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ originalName: 'text', description: 'text', tags: 'text' });
fileSchema.index({ status: 1 });
fileSchema.index({ isPublic: 1 });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  return `/uploads/${this.filename}`;
});

// Update lastAccessed when file is accessed
fileSchema.methods.updateLastAccessed = function() {
  this.lastAccessed = new Date();
  return this.save();
};

// Increment download count
fileSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

export default mongoose.model('File', fileSchema);

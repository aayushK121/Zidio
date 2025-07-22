import mongoose from 'mongoose';

const chartSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chart title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  chartType: {
    type: String,
    required: true,
    enum: [
      'bar', 'line', 'pie', 'doughnut', 'scatter', 'area', 
      'column', 'histogram', 'bubble', 'radar', 'polar',
      'funnel', 'waterfall', 'heatmap', 'treemap'
    ]
  },
  chartConfig: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  sourceFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: Date,
  exportFormats: [{
    format: {
      type: String,
      enum: ['png', 'pdf', 'svg', 'json']
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
chartSchema.index({ createdBy: 1, createdAt: -1 });
chartSchema.index({ sourceFile: 1 });
chartSchema.index({ chartType: 1 });
chartSchema.index({ isPublic: 1 });
chartSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Increment view count
chartSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Add shared user
chartSchema.methods.shareWith = function(userId, permissions = 'view') {
  const existingShare = this.sharedWith.find(share => 
    share.user.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.permissions = permissions;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      user: userId,
      permissions,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Remove shared user
chartSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(share => 
    share.user.toString() !== userId.toString()
  );
  return this.save();
};

export default mongoose.model('Chart', chartSchema);

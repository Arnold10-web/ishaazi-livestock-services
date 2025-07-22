import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Auction description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    required: [true, 'Auction location is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Auction date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Auction date must be in the future'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(value) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(value) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  livestock: [{
    category: {
      type: String,
      required: true,
      enum: ['cattle', 'dairy', 'beef', 'goats', 'sheep', 'pigs', 'poultry', 'other']
    },
    breed: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    startingPrice: {
      type: Number,
      required: true,
      min: [0, 'Starting price cannot be negative']
    },
    description: String
  }],
  auctioneer: {
    name: {
      type: String,
      required: [true, 'Auctioneer name is required']
    },
    contact: {
      phone: String,
      email: String
    },
    license: String
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value <= this.date;
      },
      message: 'Registration deadline must be before auction date'
    }
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative']
  },
  terms: {
    type: String,
    default: 'Standard auction terms and conditions apply'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files',
    default: null
  },
  published: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  interestedBuyers: [{
    name: String,
    contact: String,
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
auctionSchema.index({ date: 1, status: 1 });
auctionSchema.index({ 'livestock.category': 1 });
auctionSchema.index({ location: 1 });
auctionSchema.index({ published: 1, date: 1 });

// Virtual for days until auction
auctionSchema.virtual('daysUntilAuction').get(function() {
  const now = new Date();
  const auctionDate = new Date(this.date);
  const diffTime = auctionDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for formatted date
auctionSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save middleware to update status based on date
auctionSchema.pre('save', function(next) {
  const now = new Date();
  const auctionDate = new Date(this.date);
  
  if (auctionDate < now && this.status === 'upcoming') {
    this.status = 'completed';
  }
  
  next();
});

// Static method to find upcoming auctions
auctionSchema.statics.findUpcoming = function() {
  return this.find({
    published: true,
    status: 'upcoming',
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

// Static method to find auctions by category
auctionSchema.statics.findByCategory = function(category) {
  return this.find({
    published: true,
    'livestock.category': category
  }).sort({ date: 1 });
};

export default mongoose.model('Auction', auctionSchema);
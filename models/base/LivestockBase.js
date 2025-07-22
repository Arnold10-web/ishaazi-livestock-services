/**
 * Livestock Base Schema
 * 
 * Common fields and methods for all livestock-related models
 */
import mongoose from 'mongoose';

export const commonFields = {
  image: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'fs.files', 
    default: null 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    required: true 
  },
  metadata: { 
    type: Object, 
    default: {} 
  },
  tags: [{ 
    type: String 
  }],
  published: { 
    type: Boolean, 
    default: true 
  },
  views: { 
    type: Number, 
    default: 0 
  },
  likes: { 
    type: Number, 
    default: 0 
  }
};

export const getBaseSchema = (additionalFields = {}) => {
  return new mongoose.Schema(
    {
      ...commonFields,
      ...additionalFields
    },
    { 
      timestamps: true,
      discriminatorKey: 'type' 
    }
  );
};

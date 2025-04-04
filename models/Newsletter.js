import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: null },
});

export default mongoose.model('Newsletter', newsletterSchema);

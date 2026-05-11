import { Schema, model, models } from 'mongoose';

const FavoriteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemId: { type: String, required: true, index: true },
  itemType: { type: String, enum: ['vacancy', 'project'], default: 'project' },
  title: { type: String, default: '' },
  companyName: { type: String, default: '' },
  city: { type: String, default: '' },
  category: { type: String, default: '' },
  budgetMin: { type: Number, default: null },
  budgetMax: { type: Number, default: null },
  source: { type: String, default: '' },
}, { timestamps: true });

FavoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export default models.Favorite || model('Favorite', FavoriteSchema);

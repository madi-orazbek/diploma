import { Schema, model, models } from 'mongoose';
const ClientProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  companyName: String,
  companyDescription: String,
  website: String,
  industry: String
}, { timestamps: true });
export default models.ClientProfile || model('ClientProfile', ClientProfileSchema);

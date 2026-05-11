import { Schema, model, models } from 'mongoose';
const PaymentSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  amount: Number,
  method: String,
  status: String,
  paidAt: Date
}, { timestamps: true });
export default models.Payment || model('Payment', PaymentSchema);

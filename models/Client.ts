import { Schema, model, models } from 'mongoose';

const ClientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    project: { type: String, default: '', trim: true },
    plan: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const Client = models.Client || model('Client', ClientSchema);

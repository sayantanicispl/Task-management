import { Schema, model, models } from 'mongoose';

const EodEntrySchema = new Schema(
  {
    taskId:     { type: Schema.Types.ObjectId, required: true, unique: true },
    taskName:   { type: String, required: true },
    clientId:   { type: Schema.Types.ObjectId, default: null },
    clientName: { type: String, default: '' },
    date:       { type: Date, required: true },
    timeSpent:  { type: Number, default: 0 },
    status:     { type: String, default: '' },
    isManual:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const EodEntry = models.EodEntry || model('EodEntry', EodEntrySchema);

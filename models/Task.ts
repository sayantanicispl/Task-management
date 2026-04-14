import { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Task = models.Task || model('Task', TaskSchema);

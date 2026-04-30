import { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    done: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['', 'Completed', 'In Progress', 'Hold', 'Partially Update Sent', 'In the Queue', 'Update Sent'],
      default: '',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Member' },
  },
  { timestamps: true }
);

export const Task = models.Task || model('Task', TaskSchema);

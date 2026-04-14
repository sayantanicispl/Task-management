import { Schema, model, models } from 'mongoose';

const MemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    clientIds: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
    // NOTE: For production with many users, replace base64 photo storage
    // with a dedicated file service (S3, Cloudinary, etc.) to avoid hitting
    // MongoDB's 16 MB document limit.
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

export const Member = models.Member || model('Member', MemberSchema);

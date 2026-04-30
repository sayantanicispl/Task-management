import { Schema, model, models } from 'mongoose';

const MemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    clientIds: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
    photo: { type: String, default: null },
    email: { type: String, default: '' },
    contact: { type: String, default: '' },
    experience: { type: String, default: '' },
    telegram: { type: String, default: '' },
    telegramChatId: { type: String, default: '' },
    skills: [{ type: String }],
    isNightShift: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Member = models.Member || model('Member', MemberSchema);

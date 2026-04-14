import { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
});

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    templates: { type: [TemplateSchema], default: [] },
  },
  { timestamps: true }
);

export const Category = models.Category || model('Category', CategorySchema);

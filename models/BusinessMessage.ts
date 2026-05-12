import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessMessage extends Document {
  businessId?: mongoose.Types.ObjectId;
  businessStatusAtTime?: string; // Captured status at time of message (pending, approved, etc.)
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: Date;
}

const BusinessMessageSchema = new Schema<IBusinessMessage>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: false },
    businessStatusAtTime: { type: String, required: false },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexing for faster retrieval
BusinessMessageSchema.index({ businessId: 1, createdAt: 1 });

export default mongoose.models.BusinessMessage || 
  mongoose.model<IBusinessMessage>("BusinessMessage", BusinessMessageSchema);

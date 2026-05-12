import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDiscussionMessage {
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: Date;
}

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  businessId: Types.ObjectId;
  reason: string;
  description: string;
  status: "pending" | "recommended_under_review" | "recommended_warning" | "recommended_suspension" | "recommended_dismissal" | "dismissed" | "suspended" | "warned";
  adminNotes: string;
  reviewedBy: Types.ObjectId | null;
  superAdminDecision: string;
  decidedBy: Types.ObjectId | null;
  discussion: IDiscussionMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionMessageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User" },
  senderName: String,
  senderRole: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      enum: [
        "misconduct",
        "fraudulent_behavior",
        "poor_service",
        "false_information",
        "safety_concern",
        "other",
      ],
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
    },
    status: {
      type: String,
      enum: ["pending", "recommended_under_review", "recommended_warning", "recommended_suspension", "recommended_dismissal", "dismissed", "suspended", "warned"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    superAdminDecision: {
      type: String,
      default: "",
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    discussion: {
      type: [DiscussionMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Clear cache in development to ensure new enums are loaded
if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

const Report: Model<IReport> = mongoose.model<IReport>("Report", ReportSchema);

export default Report;

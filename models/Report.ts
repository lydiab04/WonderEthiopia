import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  businessId: Types.ObjectId;
  reason: string;
  description: string;
  status: "pending" | "under_review" | "action_taken" | "dismissed";
  adminNotes: string;
  reviewedBy: Types.ObjectId | null;
  superAdminDecision: string;
  decidedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

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
      enum: ["pending", "under_review", "action_taken", "dismissed"],
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
  },
  {
    timestamps: true,
  }
);

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;

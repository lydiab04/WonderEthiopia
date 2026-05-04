import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAppNotification extends Document {
  recipientRole: "tourism_admin" | "super_admin" | "business_owner";
  title: string;
  message: string;
  type: "business_registration" | "business_recommended" | "business_rejected" | "report_pending" | "booking_new" | "category_request" | "business_status_update" | "report_filed" | "report_resolved" | "internal_chat";
  relatedId?: Types.ObjectId;
  recipientId?: Types.ObjectId;
  sourceNotificationId?: Types.ObjectId;
  recommendationAction?: string; // 'recommend_approve' | 'recommend_reject' — set when tourism_admin acts
  recommendedAt?: Date;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<IAppNotification>(
  {
    recipientRole: {
      type: String,
      enum: ["tourism_admin", "super_admin", "business_owner"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["business_registration", "business_recommended", "business_rejected", "report_pending", "booking_new", "category_request", "business_status_update", "report_filed", "report_resolved", "internal_chat"],
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sourceNotificationId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    recommendationAction: {
      type: String,
      default: null,
    },
    recommendedAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Delete cached model to force re-registration with updated schema (handles hot-reload in dev)
if (mongoose.models.AppNotification) {
  delete (mongoose.models as any).AppNotification;
}

const AppNotification: Model<IAppNotification> =
  mongoose.model<IAppNotification>("AppNotification", NotificationSchema);

export default AppNotification;

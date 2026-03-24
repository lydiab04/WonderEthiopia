import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAppNotification extends Document {
  recipientRole: "tourism_admin" | "super_admin";
  title: string;
  message: string;
  type: "business_registration" | "business_recommended" | "business_rejected" | "report_pending";
  relatedId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<IAppNotification>(
  {
    recipientRole: {
      type: String,
      enum: ["tourism_admin", "super_admin"],
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
      enum: ["business_registration", "business_recommended", "business_rejected", "report_pending"],
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
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

const AppNotification: Model<IAppNotification> =
  mongoose.models.AppNotification || mongoose.model<IAppNotification>("AppNotification", NotificationSchema);

export default AppNotification;

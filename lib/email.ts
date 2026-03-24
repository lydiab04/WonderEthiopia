import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

export async function sendApprovalEmail(
  to: string,
  businessName: string,
  tempPassword: string
) {
  console.log(`Attempting to send approval email to ${to} using ${process.env.EMAIL_USER}...`);
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Congratulations! Your Business "${businessName}" is Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b; text-align: center;">Welcome to Wondar Ethiopia!</h2>
        <p>Dear Business Owner,</p>
        <p>We are thrilled to inform you that your registration for <strong>${businessName}</strong> has been <strong>Approved</strong> by the Super Admin.</p>
        <p>An account has been created for you. You can now log in to the Business Portal to manage your services and listings.</p>
        
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
          <h3 style="margin-top: 0; color: #d97706;">Login Credentials</h3>
          <p style="margin-bottom: 5px;"><strong>Email:</strong> ${to}</p>
          <p style="margin-bottom: 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 5px; border-radius: 3px;">${tempPassword}</code></p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">Please change your password after your first login for security reasons.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/login" style="background-color: #f59e0b; color: #000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Go to Login</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">© 2026 Wondar Ethiopia. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendRejectionEmail(
  to: string,
  businessName: string,
  reason: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Application Status Update: ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444; text-align: center;">Application Status Update</h2>
        <p>Dear Business Applicant,</p>
        <p>Thank you for your interest in registering your business, <strong>${businessName}</strong>, with Wondar Ethiopia.</p>
        <p>After a thorough review, we regret to inform you that your application has been <strong>Rejected</strong> at this time.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
          <h3 style="margin-top: 0; color: #b91c1c;">Reason for Rejection</h3>
          <p style="margin-bottom: 0; color: #7f1d1d;">${reason || "Information provided does not meet the platform requirements."}</p>
        </div>
        
        <p>You are welcome to re-apply once the issues mentioned above have been addressed. If you have any questions, please feel free to contact our support team.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">© 2026 Wondar Ethiopia. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Add EMAIL_USER to .env.local
    pass: process.env.EMAIL_PASS, // Add EMAIL_PASS to .env.local (App Password if using Gmail)
  },
  tls: {
    // This allows Nodemailer to work over networks/ISPs that use self-signed certs or local proxies
    rejectUnauthorized: false
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"WondarEthiopia" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error: any) {
    console.error("Error sending email:", error);
    // Crucial: Throw the error so the API endpoint knows it failed
    throw new Error(`Failed to send email: ${error.message || "Invalid credentials or SMTP error"}`);
  }
};

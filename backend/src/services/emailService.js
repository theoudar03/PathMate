import nodemailer from 'nodemailer';

// Create a reusable transporter using Gmail SMTP
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("WARNING: EMAIL_USER or EMAIL_PASS environment variables are not set. Nodemailer SMTP transport could not be initialized.");
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

/**
 * Sends a premium HTML email containing the verification OTP to the student.
 * 
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit numeric OTP
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
export const sendOtpEmail = async (email, otp) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    if (process.env.ALLOW_MOCK_DATA === 'true') {
      console.log(`[EmailService MOCK] OTP for ${email} is: ${otp}`);
      return true; // Return true to allow registration in local/offline test mode
    }
    throw new Error("SMTP email credentials are not configured on the server. Please set EMAIL_USER and EMAIL_PASS environment variables.");
  }

  const mailOptions = {
    from: `"PathMate SCE" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your PathMate Verification Code`,
    text: `Welcome to PathMate, the Saranathan College of Engineering freshers portal! Your verification code is: ${otp}. This code is valid for 5 minutes. Please do not share this code with anyone.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center; color: #1f2937;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1b4da6 0%, #0f2c6e 100%); padding: 35px 20px; text-align: center;">
            <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; margin: 0;">PathMate</div>
            <div style="color: #93c5fd; margin: 6px 0 0 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Saranathan College of Engineering</div>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 35px; text-align: left; background-color: #ffffff;">
            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Verify Your Email Address</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
              Welcome to PathMate! To complete your new student account registration and set up your student workspace, please enter the 6-digit verification code below:
            </p>
            
            <!-- OTP Badge Container -->
            <div style="background-color: #f3f4f6; border-radius: 20px; padding: 25px; text-align: center; margin: 25px 0; border: 1px solid rgba(0, 0, 0, 0.05);">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; color: #1b4da6; letter-spacing: 10px; margin-left: 10px; display: inline-block;">${otp}</span>
            </div>
            
            <p style="font-size: 12px; line-height: 1.5; color: #6b7280; margin: 25px 0 0 0; background-color: #f9fafb; padding: 12px 16px; border-radius: 12px; border-left: 3px solid #1b4da6;">
              <strong>Security Notice:</strong> This code is valid for <strong>5 minutes</strong> and can only be used once. Please do not share this OTP with anyone, including college staff.
            </p>
          </div>
          
          <!-- Institutional Info / Footer -->
          <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
            <p style="margin: 0; font-weight: 600;">Saranathan College of Engineering</p>
            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 10px;">Venkateswara Nagar, Trichy-Madurai Road, Panjappur, Tiruchirappalli - 620012</p>
            <div style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px; color: #9ca3af;">
              &copy; 2026 SCE PathMate. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Verification OTP successfully sent to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send verification email to ${email}:`, error.message);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
};

export default {
  sendOtpEmail
};

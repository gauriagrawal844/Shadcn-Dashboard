import prisma from "@/lib/prisma";
import nodemailer from 'nodemailer';

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Generate new OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpires,
      },
    });

    // Send OTP email
    const mailOptions = {
      from: `"Shadcn App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your New Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your New Verification Code</h2>
          <p>Hello,</p>
          <p>Your new verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Shadcn Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ 
      message: 'New OTP has been sent to your email',
      success: true 
    });

  } catch (error) {
    console.error('Error in resend-otp:', error);
    return Response.json(
      { error: 'Failed to resend OTP. Please try again.' },
      { status: 500 }
    );
  }
}

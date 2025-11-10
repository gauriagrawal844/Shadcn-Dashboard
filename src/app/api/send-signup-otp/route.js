import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

    // If a fully registered user already exists, block
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return Response.json({ error: "Email already registered! Please login..." }, { status: 400 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert into EmailVerification
    await prisma.emailVerification.upsert({
      where: { email },
      update: { otp, otpExpires, verified: false },
      create: { email, otp, otpExpires },
    });

    await sendEmail(
      email,
      "Your Signup Verification OTP",
      `<p>Your OTP for verifying email is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    return Response.json({ message: "OTP sent to email" }, { status: 200 });
  } catch (err) {
    console.error("send-signup-otp error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

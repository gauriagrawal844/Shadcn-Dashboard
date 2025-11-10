import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // Verify OTP
    if (user.otp !== otp) {
      return Response.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.otpExpires || new Date(user.otpExpires) < new Date()) {
      return Response.json({ error: "OTP expired" }, { status: 400 });
    }

    // Mark verified and clear OTP
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, emailVerified: true },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return Response.json({ message: "OTP verified successfully", token }, { status: 200 });
  } catch (error) {
    console.error("OTP verification error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

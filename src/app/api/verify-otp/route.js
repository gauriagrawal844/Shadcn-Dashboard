import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.otpExpires || new Date(user.otpExpires) < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // ✅ Clear OTP & verify email
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, emailVerified: true },
    });

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Create NextResponse (supports cookies)
    const response = NextResponse.json(
      { message: "OTP verified successfully", token },
      { status: 200 }
    );

    // ✅ Set cookie using NextResponse
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log("✅ OTP verified successfully for:", email);
    return response;
  } catch (error) {
    console.error("💥 OTP verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

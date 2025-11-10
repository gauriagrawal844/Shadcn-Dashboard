import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return Response.json({ error: "Email and OTP are required" }, { status: 400 });

    const rec = await prisma.emailVerification.findUnique({ where: { email } });
    if (!rec) return Response.json({ error: "No OTP found for this email" }, { status: 404 });

    if (rec.verified) return Response.json({ message: "Email already verified" }, { status: 200 });

    if (rec.otp !== otp) return Response.json({ error: "Invalid OTP" }, { status: 400 });

    if (!rec.otpExpires || new Date(rec.otpExpires) < new Date()) {
      return Response.json({ error: "OTP expired" }, { status: 400 });
    }

    await prisma.emailVerification.update({
      where: { email },
      data: { verified: true },
    });

    return Response.json({ message: "Email verified for signup" }, { status: 200 });
  } catch (err) {
    console.error("verify-signup-otp error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

import prisma from "@/lib/prisma";
export async function POST(req) {
  try {
    const { name, email, phone} = await req.json();

    if (!name || !email)
      return Response.json({ error: "Name and email are required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return Response.json({ error: "Email already registered" }, { status: 400 });

    // Ensure email has been verified via signup OTP
    const ev = await prisma.emailVerification.findUnique({ where: { email } });
    if (!ev || !ev.verified) {
      return Response.json({ error: "Verify your email first" }, { status: 400 });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        emailVerified: true,
      },
    });

    // Cleanup verification record
    await prisma.emailVerification.delete({ where: { email } }).catch(() => {});

    return Response.json({ message: "Signup successful" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
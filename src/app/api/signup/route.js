import prisma from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { name, email, phone } = await req.json();

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

    // Create the new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        emailVerified: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Cleanup verification record
    await prisma.emailVerification.delete({ where: { email } }).catch(() => {});

    // Create response
    const response = Response.json(
      { 
        message: "Signup successful",
        token // Send token in response for client-side storage
      },
      { 
        status: 201,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Strict; Max-Age=604800` // 7 days
        }
      }
    );

    return response;
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
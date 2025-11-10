import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    email,
    dob,
    address,
    location,
    companyName,
    companyDetails,
    profession,
    education,
    skills,
    hobbies,
    website,
    bio,
  } = body || {};

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const profile = await prisma.profile.upsert({
      where: { userId: decoded.id },
      update: {
        firstName,
        lastName,
        email,
        dob: dob ? new Date(dob) : null,
        address,
        location,
        companyName,
        companyDetails,
        profession,
        education,
        skills,
        hobbies,
        website,
        bio,
      },
      create: {
        userId: decoded.id,
        firstName,
        lastName,
        email,
        dob: dob ? new Date(dob) : null,
        address,
        location,
        companyName,
        companyDetails,
        profession,
        education,
        skills,
        hobbies,
        website,
        bio,
      },
    });

    return Response.json({ message: "Profile saved", profile }, { status: 201 });
  } catch (err) {
    console.error("/api/create-profile error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

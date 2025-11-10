import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const profile = await prisma.profile.findUnique({ where: { userId: decoded.id } });
    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

    return Response.json(profile, { status: 200 });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    console.error("GET /api/profile error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

    return Response.json({ message: "Profile updated", profile }, { status: 200 });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    console.error("PUT /api/profile error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

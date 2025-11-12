import { NextResponse } from "next/server";
import { getVisitors, addVisitor, removeVisitor } from "@/lib/visitors";
import { verifyToken } from "@/lib/auth";

// 🔐 Helper: Extract and verify JWT token from cookies
async function getAuthUser(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// 📥 GET → Fetch visitor data for the authenticated user
export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visitors = await getVisitors(user.id);
    return NextResponse.json(visitors, { status: 200 });
  } catch (error) {
    console.error("GET /api/visitors error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// ➕ POST → Add or update visitor data for the authenticated user
export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, desktop, mobile } = body;

    if (!date || desktop == null || mobile == null) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const newRecord = await addVisitor({
      date,
      desktop,
      mobile,
      userId: user.id,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("POST /api/visitors error:", error);
    return NextResponse.json({ error: "Failed to add/update data" }, { status: 500 });
  }
}

// ❌ DELETE → Remove visitor data by ID (for the authenticated user)
export async function DELETE(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = parseInt(idParam, 10);

    if (!idParam || isNaN(id)) {
      return NextResponse.json({ error: "Valid ID parameter is required" }, { status: 400 });
    }

    // First verify the record belongs to the user
    const existing = await prisma.visitor.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the record
    await prisma.visitor.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/visitors error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete data" }, { status: 500 });
  }
}

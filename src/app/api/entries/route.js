import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
const prisma = new PrismaClient();

async function getUserIdFromRequest(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  
  const decoded = await verifyToken(token);
  return decoded?.id || null;
}

export async function GET(request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.tableEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return Response.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return Response.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { header, type, status, target, limit, reviewer } = body;

    if (!header || !type || target === undefined || limit === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEntry = await prisma.tableEntry.create({
      data: {
        header: header.trim(),
        type: type.trim(),
        status: (status || 'In Process').trim(),
        target: Number(target),
        limit: Number(limit),
        reviewer: reviewer ? reviewer.trim() : null,
        userId: user.id,
      },
    });

    return Response.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return Response.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

// update
export async function PUT(req) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, header, type, status, target, limit, reviewer } = body;

    const entryId = Number(id);
    if (!entryId || isNaN(entryId)) {
      return Response.json({ error: "Invalid or missing entry ID" }, { status: 400 });
    }

    // Check if the entry exists and belongs to the user
    const existing = await prisma.tableEntry.findFirst({
      where: { 
        id: entryId,
        userId: userId 
      }
    });

    if (!existing) {
      return Response.json({ error: "Entry not found or access denied" }, { status: 404 });
    }

    const updatedEntry = await prisma.tableEntry.update({
      where: { id: entryId },
      data: {
        header: header?.trim(),
        type: type?.trim(),
        status: (status || "In Process").trim(),
        target: Number(target),
        limit: Number(limit),
        reviewer: reviewer ? reviewer.trim() : null,
      },
    });

    // Return the updated entry in a consistent format
    return new Response(JSON.stringify({
      success: true,
      ...updatedEntry,
      target: Number(updatedEntry.target),
      limit: Number(updatedEntry.limit),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update entry" },
      { status: 500 }
    );
  }
}


// Delete
export async function DELETE(req) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    console.log("🗑️ DELETE called with body ID:", id);
    if (!id) {
      console.error("❌ No ID provided in DELETE request");
      return Response.json(
        { error: "Entry ID is required for deletion" },
        { status: 400 }
      );
    }

    const entryId = Number(id);
    if (isNaN(entryId)) {
      console.error("❌ Invalid ID format:", id);
      return Response.json(
        { error: "Invalid entry ID format" },
        { status: 400 }
      );
    }

    console.log("🔍 Looking for entry with ID:", entryId);
    // Check if the entry exists and belongs to the user
    const existing = await prisma.tableEntry.findFirst({
      where: { 
        id: entryId,
        userId: userId 
      }
    });

    if (!existing) {
      console.error("❌ Entry not found or access denied for ID:", entryId);
      return Response.json(
        { error: "Entry not found or access denied" },
        { status: 404 }
      );
    }

    console.log("✅ Found entry, proceeding with deletion");
    await prisma.tableEntry.delete({
      where: { id: entryId },
    });

    console.log("✅ Successfully deleted entry");
    return Response.json(
      { success: true, message: "Entry deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in DELETE handler:", error);
    return Response.json(
      { error: error.message || "Failed to delete entry" },
      { status: 500 }
    );
  }
}
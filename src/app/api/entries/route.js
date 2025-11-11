import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const entries = await prisma.tableEntry.findMany({
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
    const body = await req.json();
    const { id, header, type, status, target, limit, reviewer } = body;

    const entryId = Number(id);
    if (!entryId || isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid or missing entry ID" }, { status: 400 });
    }

    const existing = await prisma.tableEntry.findUnique({ where: { id: entryId } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
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
    const body = await req.json();
    const { id } = body;

    console.log("🗑️ DELETE called with body ID:", id);

    if (!id) {
      return Response.json({ error: "Missing ID in body" }, { status: 400 });
    }

    const entryId = Number(id);
    if (isNaN(entryId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const existing = await prisma.tableEntry.findUnique({ where: { id: entryId } });
    if (!existing) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.tableEntry.delete({ where: { id: entryId } });

    return Response.json({ success: true, deletedId: entryId });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return Response.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
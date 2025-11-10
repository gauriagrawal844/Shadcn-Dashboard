import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const VALID_HEADINGS = [
    "Total Revenue",
    "New Customers",
    "Active Accounts",
    "Growth Rate"
];

export async function POST(req) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token)
            return Response.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const body = await req.json();

        const { heading, currentValue, previousValue, description, note } = body;

        // ✅ Validate heading
        if (!VALID_HEADINGS.includes(heading)) {
            return Response.json(
                { error: "Invalid heading. Must be one of the 4 fixed options." },
                { status: 400 }
            );
        }

        const changePercent =
            previousValue && previousValue !== 0
                ? ((currentValue - previousValue) / previousValue) * 100
                : 0;

        // ✅ Check if this heading already exists for this user
        const existing = await prisma.card.findFirst({
            where: {
                userId: decoded.id,
                heading
            }
        });

        let card;

        if (existing) {
            // ✅ Update existing card instead of creating new one
            card = await prisma.card.update({
                where: { id: existing.id },
                data: {
                    currentValue,
                    previousValue,
                    changePercent,
                    description,
                    note
                }
            });
        } else {
            // ✅ Check total cards (no more than 4)
            const cardCount = await prisma.card.count({
                where: { userId: decoded.id }
            });

            if (cardCount >= 4) {
                return Response.json(
                    { error: "You can only have 4 cards total." },
                    { status: 400 }
                );
            }

            // ✅ Create new card
            card = await prisma.card.create({
                data: {
                    userId: decoded.id,
                    heading,
                    currentValue,
                    previousValue,
                    changePercent,
                    description,
                    note
                }
            });
        }

        return Response.json({ message: "Card saved successfully", card }, { status: 201 });
    } catch (err) {
        console.error("POST /api/cards error:", err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}


export async function GET(req) {
  try {
    // Check if user is logged in (token must exist)
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Verify token (just to ensure valid user)
    jwt.verify(token, process.env.JWT_SECRET);

    // Fetch all shared cards (common for all users)
    const cards = await prisma.card.findMany({
      orderBy: {createdAt: "asc"},
    });

    return Response.json(cards, { status: 200 });
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Verify token but don't use the user ID since cards are common
    jwt.verify(token, process.env.JWT_SECRET);
    
    const { heading, currentValue, previousValue, description, note } = await req.json();
    
    if (!heading) {
      return Response.json({ error: "Heading is required" }, { status: 400 });
    }

    // Find the card by heading (which is now unique)
    const existingCard = await prisma.card.findUnique({
      where: { heading }
    });

    if (!existingCard) {
      return Response.json({ error: "Card not found" }, { status: 404 });
    }

    // Calculate change percentage
    const changePercent = previousValue && previousValue !== 0
      ? ((Number(currentValue) - Number(previousValue)) / Number(previousValue)) * 100
      : 0;

    // Update the card using its ID
    const updated = await prisma.card.update({
      where: { 
        id: existingCard.id
      },
      data: {
        currentValue: Number(currentValue) || 0,
        previousValue: Number(previousValue) || 0,
        changePercent,
        description: description || null,
        note: note || null,
      },
    });

    return Response.json(
      { message: "Card updated successfully", card: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/cards error:", err);
    if (err.name === 'JsonWebTokenError') {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    } else if (err.code === 'P2025') {
      return Response.json({ error: "Card not found" }, { status: 404 });
    }
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
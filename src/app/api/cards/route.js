import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from 'next/server';

const VALID_HEADINGS = [
    "Total Revenue",
    "New Customers",
    "Active Accounts",
    "Growth Rate"
];

export async function POST(req) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const body = await req.json();

        const { heading, currentValue, previousValue, description, note } = body;

        // Validate heading
        if (!VALID_HEADINGS.includes(heading)) {
            return NextResponse.json(
                { error: "Invalid heading. Must be one of the 4 fixed options." },
                { status: 400 }
            );
        }

        const changePercent =
            previousValue && previousValue !== 0
                ? ((currentValue - previousValue) / previousValue) * 100
                : 0;

        // Check if this heading already exists for this user
        const existing = await prisma.card.findFirst({
            where: {
                userId: decoded.id,
                heading
            }
        });

        let card;

        if (existing) {
            // Update existing card
            card = await prisma.card.update({
                where: { id: existing.id },
                data: {
                    currentValue: Number(currentValue) || 0,
                    previousValue: Number(previousValue) || 0,
                    changePercent,
                    description: description || null,
                    note: note || null
                }
            });
        } else {
            // Check total cards (no more than 4)
            const cardCount = await prisma.card.count({
                where: { userId: decoded.id }
            });

            if (cardCount >= 4) {
                return NextResponse.json(
                    { error: "You can only have 4 cards total." },
                    { status: 400 }
                );
            }

            // Create new card
            card = await prisma.card.create({
                data: {
                    userId: decoded.id,
                    heading,
                    currentValue: Number(currentValue) || 0,
                    previousValue: Number(previousValue) || 0,
                    changePercent,
                    description: description || null,
                    note: note || null
                }
            });
        }

        return NextResponse.json(
            { message: "Card saved successfully", card },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/cards error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: err.name === 'JsonWebTokenError' ? 401 : 500 }
        );
    }
}


export async function GET(req) {
  try {
    // Check if user is logged in (token must exist)
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Verify token and get user ID
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    
    // Get user ID from query params if provided (for admin purposes)
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || userId;

    // Only allow users to fetch their own cards unless they're admin
    if (targetUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to access these cards" },
        { status: 403 }
      );
    }

    // Fetch only the cards for the requested user
    const cards = await prisma.card.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(cards, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Server error",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { id, heading, currentValue, previousValue, description, note } = await req.json();
    
    if (!heading) {
      return NextResponse.json(
        { error: "Heading is required" },
        { status: 400 }
      );
    }

    // Find the card by ID and user ID to ensure ownership
    const existingCard = await prisma.card.findFirst({
      where: { 
        id,
        userId: decoded.id 
      }
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate change percentage
    const changePercent = previousValue && previousValue !== 0
      ? ((Number(currentValue) - Number(previousValue)) / Number(previousValue)) * 100
      : 0;

    // Update the card
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

    return NextResponse.json(
      { message: "Card updated successfully", card: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/cards error:", err);
    if (err.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    } else if (err.code === 'P2025') {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
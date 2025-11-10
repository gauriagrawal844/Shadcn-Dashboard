// app/api/chart/route.js
import { NextResponse } from "next/server";
import { getVisitors, addVisitor } from "@/lib/visitors";

// GET → fetch all visitor data
export async function GET() {
  try {
    const visitors = await getVisitors();
    return NextResponse.json(visitors);
  } catch (error) {
    console.error("GET /api/chart error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// POST → add new visitor data
export async function POST(request) {
  try {
    const body = await request.json();
    const { date, desktop, mobile } = body;

    if (!date || desktop == null || mobile == null) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const newRecord = await addVisitor({ date, desktop, mobile });
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("POST /api/chart error:", error);
    return NextResponse.json({ error: "Failed to add data" }, { status: 500 });
  }
}

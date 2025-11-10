import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const entries = await prisma.tableEntry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return Response.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return Response.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { header, type, status, target, limit, reviewer } = requestBody;
    
    // Validate required fields
    if (!header || !type || target === undefined || limit === undefined) {
      console.error('Missing required fields:', { header, type, target, limit });
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a new UUID for the ID
    const { v4: uuidv4 } = require('uuid');
    
    const newEntry = await prisma.tableEntry.create({
      data: {
        id: uuidv4(), // Generate a new UUID for the ID
        header: header.toString().trim(),
        type: type.toString().trim(),
        status: (status || 'In Process').toString().trim(),
        target: parseInt(target, 10),
        limit: parseInt(limit, 10),
        reviewer: reviewer ? reviewer.toString().trim() : null,
      },
    });
    
    console.log('Created entry:', newEntry);
    return Response.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return Response.json(
      { 
        error: 'Failed to create entry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

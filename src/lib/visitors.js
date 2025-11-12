import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getVisitors(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const visitors = await prisma.visitor.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return visitors;
  } catch (error) {
    console.error('Error fetching visitors:', error);
    throw error;
  }
}

export async function addVisitor(data) {
  const { date, desktop, mobile, userId } = data;
  
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {    
    // Check if data for this date and user already exists
    const existing = await prisma.visitor.findFirst({
      where: { 
        date: new Date(date),
        userId: userId
      },
    });

    let result;
    if (existing) {
      // Update existing record
      result = await prisma.visitor.update({
        where: { id: existing.id },
        data: { 
          desktop: parseInt(desktop),
          mobile: parseInt(mobile) 
        },
      });
    } else {
      // Create new record
      result = await prisma.visitor.create({
        data: {
          date: new Date(date),
          desktop: parseInt(desktop),
          mobile: parseInt(mobile),
          userId: userId
        },
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error adding/updating visitor data:', error);
    throw error;
  }
}

export async function removeVisitor(date, userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!date) {
    throw new Error('Date is required');
  }

  try {
    // Parse the date and create start/end of day for range query
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find the visitor record for the given date and user
    const existing = await prisma.visitor.findFirst({
      where: { 
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        userId: userId
      },
    });

    if (!existing) {
      throw new Error('No visitor data found for the specified date');
    }

    // Delete the visitor record
    await prisma.visitor.delete({
      where: { id: existing.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing visitor data:', error);
    throw error;
  }
}

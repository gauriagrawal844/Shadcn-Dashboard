import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getVisitors() {
  try {
    const visitors = await prisma.visitor.findMany({
      orderBy: {
        date: 'asc',
      },
    });
    return visitors;
  } catch (error) {
    console.error('Error fetching visitors:', error);
    throw error;
  }
}

export async function addVisitor(data) {
  try {
    const { date, desktop, mobile } = data;
    
    // Check if data for this date already exists
    const existing = await prisma.visitor.findFirst({
      where: { date: new Date(date) },
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
        },
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error adding/updating visitor data:', error);
    throw error;
  }
}

export async function removeVisitor(date) {
  try {
    // First find the record by date
    const record = await prisma.visitor.findFirst({
      where: { date: new Date(date) },
    });

    if (record) {
      await prisma.visitor.delete({
        where: { id: record.id },
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing visitor data:', error);
    throw error;
  }
}

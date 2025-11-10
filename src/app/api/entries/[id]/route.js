import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(_, { params }) {
  try {
    const { id } = params;
    
    await prisma.tableEntry.delete({
      where: { id },
    });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return Response.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}

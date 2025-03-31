import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Find the enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        classId: classId,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 404 });
    }

    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        id: enrollment.id,
      },
    });

    return NextResponse.json({ message: 'Successfully unenrolled' });
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    return NextResponse.json({ error: 'Failed to unenroll from class' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Check if user is admin
  if (!session?.user?.email || session.user.email !== "joseph.liao1018@gmail.com") {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { classId, userId } = await request.json();

    if (!classId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find and delete the enrollment
    const enrollment = await prisma.enrollment.delete({
      where: {
        userId_classId: {
          userId: userId,
          classId: classId,
        },
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error unenrolling user:', error);
    return NextResponse.json(
      { error: 'Failed to unenroll user from class' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { classId } = await req.json();
    
    // Check if class exists and has capacity
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: { enrollments: true },
    });
    
    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    if (classItem.enrollments.length >= classItem.capacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 });
    }
    
    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        classId,
      },
    });
    
    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 });
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        classId,
      },
    });
    
    return NextResponse.json(enrollment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enroll in class' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  console.log('Enroll API called');
  const session = await getServerSession(authOptions);
  
  console.log('Session state:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: 'You must be logged in to enroll in classes' },
      { status: 401 }
    );
  }
  
  try {
    const { classId } = await req.json();
    
    if (!classId) {
      return NextResponse.json(
        { message: 'Class ID is required' },
        { status: 400 }
      );
    }
    
    // Check if class exists and has available spots
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: { enrollments: true }
    });
    
    if (!classItem) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      );
    }
    
    if (classItem.enrollments.length >= classItem.capacity) {
      return NextResponse.json(
        { message: 'Class is full' },
        { status: 400 }
      );
    }
    
    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        classId: classId
      }
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id as string,
        classId: classId
      }
    });
    
    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/db';

const prismaClient = new PrismaClient();

// Admin emails for authorization
const ADMIN_EMAILS = ['joseph.liao1018@gmail.com']; // Add your admin emails here

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  return session && session.user && ADMIN_EMAILS.includes(session.user.email as string);
}

// GET all classes (for admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await prismaClient.class.findMany({
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    // Transform the data to ensure user information is properly included
    const transformedClasses = classes.map(classItem => ({
      ...classItem,
      enrollments: classItem.enrollments.map(enrollment => ({
        ...enrollment,
        user: {
          id: enrollment.user.id,
          name: enrollment.user.name || enrollment.user.email.split('@')[0], // Use email username if name is not set
          email: enrollment.user.email,
        },
      })),
    }));

    return NextResponse.json(transformedClasses);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

// CREATE a new class
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== 'joseph.liao1018@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    }
    if (!body.endTime) {
      return NextResponse.json({ error: 'End time is required' }, { status: 400 });
    }
    if (!body.capacity || body.capacity < 1) {
      return NextResponse.json({ error: 'Valid capacity is required' }, { status: 400 });
    }

    // Validate that startTime is before endTime
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    
    console.log('Parsed dates:', { startTime, endTime });
    
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start time format' }, { status: 400 });
    }
    if (isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid end time format' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    const classData = {
      title: body.title,
      description: body.description || '',
      startTime: startTime,
      endTime: endTime,
      capacity: Number(body.capacity),
    };

    console.log('Creating class with data:', classData);

    try {
      // Create the class
      const newClass = await prismaClient.class.create({
        data: classData,
      });
      
      console.log('Class created successfully:', newClass);
      return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
      console.error('Prisma error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create class in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE a class
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== 'joseph.liao1018@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }
    
    // Check if class exists
    const existingClass = await prismaClient.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Delete the class (enrollments will be cascade deleted)
    await prismaClient.class.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class. Please try again.' },
      { status: 500 }
    );
  }
} 
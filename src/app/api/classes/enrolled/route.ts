import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const classes = await prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        enrollments: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching enrolled classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled classes' },
      { status: 500 }
    );
  }
} 
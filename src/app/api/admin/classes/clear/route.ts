import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const ADMIN_EMAILS = ['joseph.liao1018@gmail.com'];

export async function DELETE() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First delete all enrollments (due to foreign key constraints)
    await prisma.enrollment.deleteMany({});
    
    // Then delete all classes
    await prisma.class.deleteMany({});

    return NextResponse.json({ message: 'All classes cleared successfully' });
  } catch (error) {
    console.error('Error clearing classes:', error);
    return NextResponse.json(
      { error: 'Failed to clear classes' },
      { status: 500 }
    );
  }
} 
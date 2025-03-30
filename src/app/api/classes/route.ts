import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        enrollments: true,
      },
    });
    
    return NextResponse.json(classes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
} 
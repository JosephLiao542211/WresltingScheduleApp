import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name: name || email.split("@")[0], // Use part of email as name if not provided
      },
    });

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    // Log the full error details
    console.error("Registration error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown error type",
    });

    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("P2002")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }
      if (error.message.includes("P1001")) {
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error creating user. Please try again later." },
      { status: 500 }
    );
  }
}

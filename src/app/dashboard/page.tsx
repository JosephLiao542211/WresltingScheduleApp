import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Calendar from "@/components/Calendar";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const classes = await prisma.class.findMany({
    include: {
      enrollments: {
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <main className="container mx-auto py-8 px-4">
      <Calendar classes={classes} userId={session.user.id} />
    </main>
  );
} 
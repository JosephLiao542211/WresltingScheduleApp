Sure! Here's a polished and professional `README.md` description for your GitHub repository:

---

# Wrestling Schedule App 🗓️🤼

A full-stack class scheduling platform built for the **Queen’s University Wrestling Team**. Designed to streamline coordination between **team members, club athletes, and coaches**, the app simplifies the process of sharing and managing weekly training schedules.

> ✅ **100+ active users** from Queen’s Wrestling — including varsity athletes, club members, and coaching staff.

## 🌐 Live Demo  
Check it out here: [wreslting-schedule-app.vercel.app](https://wreslting-schedule-app.vercel.app/)

---

## 🚀 Features

- 🧑‍🤝‍🧑 **User Roles:** Support for athletes, club members, and coaches.
- 📅 **Weekly Scheduling:** View and update availability on a clean, intuitive calendar.
- 🔄 **Real-Time Updates:** Changes made by users reflect instantly across the platform.
- 🔐 **Secure Auth:** Authentication system to ensure only verified users can access or modify data.
- 📊 **Coach Dashboard:** Allows coaches to see team availability and coordinate optimal practice times.

---

## 🛠 Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Prisma ORM](https://www.prisma.io/) + [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📈 Impact

- Over **100 registered users** across different roles.
- Improved communication and scheduling efficiency for the entire wrestling program.
- Used regularly by athletes and staff to align training availability.

---

## 📥 Setup (Local Development)

```bash
git clone https://github.com/yourusername/wrestling-schedule-app.git
cd wrestling-schedule-app
npm install
```

Create a `.env` file and add your database connection string and environment variables:

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/wrestling
NEXTAUTH_SECRET=your_secret_here
```

Run the app locally:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## 🧠 Inspiration

This app was created out of a need for **better schedule coordination** within Queen's Wrestling. Instead of messy group chats and spreadsheets, the team now has a centralized, purpose-built tool tailored to their needs.

---

## 📫 Contributing or Questions?

Feel free to open an issue or submit a pull request. For any questions or feedback, contact [your email or social link here].

---

Let me know if you’d like this in a more casual or professional tone, or if you want to add screenshots, badges, or a contributors section!

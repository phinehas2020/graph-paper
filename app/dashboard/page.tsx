import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.email}!</p>
    </div>
  )
}

export default Dashboard

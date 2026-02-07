import { redirect } from "next/navigation"

export default function HomePage() {
  // In a real app, this would check actual auth state (cookies, session, etc.)
  // For now, we redirect to login - authenticated users would be redirected to /dashboard
  const isAuthenticated = false // TODO: Replace with actual auth check

  if (isAuthenticated) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}

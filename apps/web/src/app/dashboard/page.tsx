import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-10">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-[#94A3B8]">Bienvenido, {user.email}</p>
      <div className="mt-8 p-6 bg-[#1E2329] rounded-xl border border-[#6C757D]/20">
        <p>Este es el panel de usuario estándar.</p>
      </div>
    </div>
  )
}

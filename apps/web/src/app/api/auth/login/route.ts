import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json()
    const supabase = await createClient()

    let email = identifier

    // Si no parece un correo, asumimos que es un username
    if (identifier && !identifier.includes('@')) {
      // Usamos un cliente Admin temporal para buscar el email del usuario de forma segura
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single()

      if (!profile || !profile.email) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      
      email = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Login successful
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

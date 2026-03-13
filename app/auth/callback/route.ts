import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Criar perfil para novo usuário Google
        const username = (data.user.email?.split('@')[0] || 'user' + Date.now())
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20)

        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: data.user.user_metadata?.full_name || username,
          bio: 'Busólogo.',
          avatar: '👤',
        })
      }

      return NextResponse.redirect(`${origin}/atividade`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}

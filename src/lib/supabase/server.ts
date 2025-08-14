import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 서버 환경변수에 없습니다.')
}

export const supabaseAdmin = createClient(url, serviceRole)

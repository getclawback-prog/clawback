const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key bypasses RLS completely
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const userId = req.method === 'GET'
    ? req.query.userId
    : req.body?.userId

  if (!userId) return res.status(400).json({ error: 'userId required' })

  const month = new Date().toISOString().slice(0, 7)

  // GET — return current letter count for this user
  if (req.method === 'GET') {
    // Prevent caching so mobile always gets fresh count
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('letters_used, month')
        .eq('user_id', userId)
        .single()

      if (error || !data) return res.status(200).json({ count: 0 })

      // New month — return 0
      if (data.month !== month) return res.status(200).json({ count: 0 })

      return res.status(200).json({ count: data.letters_used || 0 })
    } catch(e) {
      return res.status(200).json({ count: 0 })
    }
  }

  // POST — update letter count
  if (req.method === 'POST') {
    const count = req.body?.count
    if (count === undefined) return res.status(400).json({ error: 'count required' })

    try {
      await supabase
        .from('profiles')
        .update({ letters_used: count, month })
        .eq('user_id', userId)

      return res.status(200).json({ ok: true, count })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

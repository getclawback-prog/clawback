// REPLACE the fetch call inside the generate() function in App.jsx
// Find this block:
//   const res = await fetch('https://api.anthropic.com/v1/messages', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({...})
//   })
//   const data = await res.json()
//   const text = data.content?.[0]?.text || ''

// REPLACE WITH:
//   const res = await fetch('/api/generate', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ prompt })
//   })
//   const data = await res.json()
//   if (!res.ok) throw new Error(data.error || 'API error')
//   const text = data.text || ''

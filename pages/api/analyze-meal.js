export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, imageType } = req.body

  if (!imageBase64) return res.status(400).json({ error: '画像データがありません' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'APIキーが設定されていません' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: `あなたはパーソナルジムAct.（刈谷市・柔道整復師資格）の食事アドバイザーです。この食事写真を分析して以下のJSON形式のみで回答（マークダウン・コードブロック不要）:
{"score":75,"detected":"食事内容（20字以内）","good_points":["良い点1","良い点2"],"improvements":[{"title":"改善点","desc":"アドバイス（40字以内）","priority":"high"},{"title":"改善点","desc":"アドバイス（40字以内）","priority":"mid"},{"title":"改善点","desc":"アドバイス（40字以内）","priority":"low"}]}
priorityはhigh/mid/lowのみ。JSONのみ返答。` }
          ]
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(500).json({ error: `API error: ${data.error?.message || JSON.stringify(data)}` })
    }

    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'レスポンスが空です' })
    }

    const text = data.content[0].text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(text)
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

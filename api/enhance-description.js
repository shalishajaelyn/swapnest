// api/enhance-description.js
// Proxies AI description enhancement through the server
// so the Anthropic API key is never exposed in frontend code

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { description, tone } = req.body;

    if (!description || description.length < 20) {
      return res.status(400).json({ error: 'Description too short' });
    }

    const toneInstructions = {
      professional: 'formal, factual and straightforward. Use clear, precise language.',
      warm: 'warm, friendly and lifestyle-focused. Emphasise comfort, community and liveability.',
      bold: 'bold, exciting and energetic. Use dynamic language that sells the dream.',
      minimal: 'clean, concise and minimal. Short sentences, no fluff, just the key facts.',
      premium: 'premium, aspirational and luxurious. Elevated language that conveys exclusivity and quality.',
      family: 'family-friendly, highlighting space, school zones, safety, community and outdoor living.',
      investment: 'investment-focused, emphasising rental yield potential, capital growth, location value and market opportunity.'
    };

    const prompt = `You are a NZ property copywriter. Rewrite the following property description in a ${toneInstructions[tone] || toneInstructions.professional} tone. Keep all factual details accurate. Write in 2-4 paragraphs. Do not add information that wasn't in the original. Output only the rewritten description, nothing else.\n\nOriginal description:\n${description}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const enhanced = data.content?.[0]?.text || '';
    if (!enhanced) throw new Error('No response from AI');

    return res.status(200).json({ enhanced });

  } catch (err) {
    console.error('AI enhancement error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

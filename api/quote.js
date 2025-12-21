export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, existingQuotes = [] } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  if (action === 'generate-quote') {
    const existingAuthors = existingQuotes.map(q => q.author).join(', ');
    
    const systemPrompt = `You are a curator of powerful, timeless quotes for an accountability group focused on personal growth, business success, and self-improvement. Select quotes that inspire action and accountability.`;
    
    const userPrompt = `Generate a weekly inspirational quote for an accountability group. 
${existingAuthors ? `Avoid these authors who were already used: ${existingAuthors}` : ''}

Respond in this exact JSON format:
{
  "quote": "The exact quote text",
  "author": "Person's Name",
  "authorTitle": "Their most notable title/role (e.g., 'Founder of Apple', 'Roman Emperor', 'Civil Rights Leader')",
  "authorBio": "2-3 sentences about who they were and why they're significant",
  "whyItMatters": "1-2 sentences on why this quote is powerful for accountability",
  "personalApplication": "2-3 bullet points on how to apply this to personal life",
  "businessApplication": "2-3 bullet points on how to apply this to business/career",
  "closingThought": "One powerful sentence to end with - a call to action or reflection"
}

Choose from influential leaders, entrepreneurs, philosophers, athletes, or historical figures. The quote should be authentic and verifiable.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      const data = await response.json();
      
      if (data.error) {
        return res.status(500).json({ error: data.error.message });
      }

      // Parse the JSON response
      const content = data.choices[0].message.content;
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: 'Failed to parse quote response' });
      }
      
      const quoteData = JSON.parse(jsonMatch[0]);
      quoteData.id = `quote_${Date.now()}`;
      quoteData.createdAt = new Date().toISOString();
      quoteData.weekOf = getWeekStart();
      
      return res.status(200).json(quoteData);
    } catch (error) {
      console.error('Quote generation error:', error);
      return res.status(500).json({ error: 'Failed to generate quote' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

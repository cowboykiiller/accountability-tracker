export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, existingQuotes = [] } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  if (action === 'generate-quote') {
    const existingAuthors = existingQuotes.map(q => q.author).filter(Boolean).join(', ');
    const existingThemes = existingQuotes.map(q => q.theme).filter(Boolean).join(', ');
    
    const systemPrompt = `You are a curator of powerful, timeless quotes for an accountability group focused on personal growth, business success, and self-improvement. 

Your job is to:
1. First, choose an inspiring THEME for the week
2. Then, find a perfect quote that embodies that theme
3. Build out the content around that theme-quote pairing

The theme should be memorable, action-oriented, and 2-4 words.`;
    
    const userPrompt = `Generate a weekly theme and matching inspirational quote for an accountability group.

STEP 1: Choose a powerful theme first. Make it:
- 2-4 words
- Action-oriented and inspiring
- Something that could guide someone's week
${existingThemes ? `\nAvoid these themes already used: ${existingThemes}` : ''}

Great theme examples: "Embrace the Struggle", "Relentless Focus", "Start Before Ready", "Own Your Morning", "Fear Is Fuel", "Progress Over Perfection", "Discipline Equals Freedom", "Show Up Daily", "Burn the Boats", "Trust the Process"

STEP 2: Find a quote from a notable person that perfectly captures this theme.
${existingAuthors ? `Avoid these authors already used: ${existingAuthors}` : ''}

Respond in this exact JSON format:
{
  "theme": "Your 2-4 word theme (THIS IS REQUIRED - do not leave blank)",
  "quote": "The exact quote text that embodies this theme",
  "author": "Person's Name",
  "authorTitle": "Their most notable title/role (e.g., 'Founder of Apple', 'Roman Emperor', 'Civil Rights Leader')",
  "authorBio": "2-3 sentences about who they were and why they're significant",
  "whyItMatters": "1-2 sentences connecting the quote to the theme and why it matters for accountability",
  "personalApplication": ["First bullet point for personal life", "Second bullet point", "Third bullet point"],
  "businessApplication": ["First bullet point for business/career", "Second bullet point", "Third bullet point"],
  "closingThought": "One powerful sentence call-to-action that references the theme"
}

IMPORTANT: The theme field must be filled with an inspiring 2-4 word phrase. Never leave it empty or use generic text like "Weekly Wisdom".`;

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
          temperature: 0.85
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
      
      // Ensure theme exists - fallback to generating from quote if missing
      if (!quoteData.theme || quoteData.theme === 'Weekly Wisdom' || quoteData.theme.length < 3) {
        // Extract a theme from the quote or author
        const words = quoteData.quote.split(' ').slice(0, 4).join(' ');
        quoteData.theme = words.length > 20 ? words.substring(0, 20) + '...' : words;
      }
      
      // Ensure applications are arrays
      if (typeof quoteData.personalApplication === 'string') {
        quoteData.personalApplication = quoteData.personalApplication.split(/[•\-\n]/).filter(s => s.trim().length > 3).map(s => s.trim());
      }
      if (typeof quoteData.businessApplication === 'string') {
        quoteData.businessApplication = quoteData.businessApplication.split(/[•\-\n]/).filter(s => s.trim().length > 3).map(s => s.trim());
      }
      
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

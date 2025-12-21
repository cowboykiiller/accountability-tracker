export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, habits, participant, goal } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  let systemPrompt = '';
  let userPrompt = '';

  // Build prompts based on action type
  switch (action) {
    case 'weekly-coach':
      systemPrompt = `You are an encouraging accountability coach for a habit tracking app. You're supportive but honest. Keep responses concise (2-3 paragraphs max). Use emojis sparingly to add warmth.`;
      
      const completedHabits = habits.filter(h => {
        const completed = h.daysCompleted?.length || 0;
        return completed >= h.target;
      });
      const missedHabits = habits.filter(h => {
        const completed = h.daysCompleted?.length || 0;
        return completed < h.target * 0.5;
      });
      const completionRate = habits.length > 0 
        ? Math.round((completedHabits.length / habits.length) * 100) 
        : 0;

      userPrompt = `Give ${participant} feedback on their week. 
      
Stats:
- Overall completion: ${completionRate}%
- Habits completed: ${completedHabits.length}/${habits.length}
- Habits completed: ${completedHabits.map(h => h.habit).join(', ') || 'None'}
- Habits missed (below 50%): ${missedHabits.map(h => h.habit).join(', ') || 'None'}

Give specific, actionable encouragement. Celebrate wins and gently address struggles.`;
      break;

    case 'insights':
      systemPrompt = `You are a data-driven habit analyst. Identify patterns and provide actionable insights. Be specific and concise. Use bullet points for clarity.`;
      
      // Group habits by participant
      const byParticipant = {};
      habits.forEach(h => {
        if (!byParticipant[h.participant]) byParticipant[h.participant] = [];
        byParticipant[h.participant].push(h);
      });

      // Calculate stats per participant
      const participantStats = Object.entries(byParticipant).map(([name, pHabits]) => {
        const completed = pHabits.filter(h => (h.daysCompleted?.length || 0) >= h.target).length;
        const rate = pHabits.length > 0 ? Math.round((completed / pHabits.length) * 100) : 0;
        return `${name}: ${rate}% completion (${completed}/${pHabits.length} habits)`;
      });

      userPrompt = `Analyze these habit tracking patterns and provide insights:

Team Stats:
${participantStats.join('\n')}

All habits data:
${habits.map(h => `- ${h.participant}: "${h.habit}" - ${h.daysCompleted?.length || 0}/${h.target} days (Week: ${h.weekStart})`).join('\n')}

Identify:
1. Who's doing well and why
2. Common struggles across the team
3. Patterns (which habit types succeed/fail)
4. One specific suggestion for each person`;
      break;

    case 'suggest-habits':
      systemPrompt = `You are a habit design expert. Create specific, measurable habits that are achievable. Each habit should have a clear daily/weekly target.`;
      
      userPrompt = `${participant} wants to: "${goal}"

Suggest 3-5 specific, measurable habits that would help achieve this goal. For each habit, include:
- The habit name (keep it short, under 8 words)
- Suggested days per week (1-7)
- Why this habit helps

Format each as:
**Habit Name** (X days/week)
Brief explanation`;
      break;

    case 'write-habit':
      systemPrompt = `You are a habit design expert. Turn vague goals into specific, measurable habits.`;
      
      userPrompt = `Turn this goal into a specific, trackable habit: "${goal}"

Provide:
1. A clear habit name (under 8 words)
2. Recommended days per week
3. What "done" looks like each day
4. One tip for staying consistent`;
      break;

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }

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
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({ 
      message: data.choices[0].message.content 
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, habits, participant, goal, conversation, quote, author, personalApplication, businessApplication } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  let systemPrompt = '';
  let userPrompt = '';
  let messages = [];

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
      systemPrompt = `You are a habit design expert. Create specific, measurable habits that are achievable. Each habit should have a clear daily/weekly target. Format your suggestions as a bulleted list with the habit name followed by the number of days.`;
      
      userPrompt = `${participant} wants to: "${goal}"

Suggest 4-6 specific, measurable habits that would help achieve this goal.

IMPORTANT: Format each habit as a bullet point like this:
• Habit name here - X days

Example format:
• Morning meditation for 10 minutes - 5 days
• Read for 20 minutes before bed - 7 days
• Take a 15-minute walk after lunch - 5 days

Keep habit names short (under 8 words). Include a mix of easy (3 days) and challenging (5-7 days) habits.`;
      break;

    case 'write-habit':
      systemPrompt = `You are a habit design expert. Turn vague goals into specific, measurable habits. Format suggestions as bullet points.`;
      
      userPrompt = `Turn this goal into specific, trackable habits: "${goal}"

Provide 2-3 habit options formatted as bullet points:
• Habit name - X days

Then briefly explain what "done" looks like and one tip for consistency.`;
      break;

    case 'quote-habits':
      systemPrompt = `You are a habit design expert who helps people apply wisdom from inspirational quotes to their daily lives. Create practical, specific habits based on the quote's message.`;
      
      userPrompt = `Based on this inspirational quote and its applications, suggest 4-5 specific habits that would help ${participant} apply this wisdom in their daily life.

Quote: "${quote}" - ${author}

Personal Application: ${personalApplication}
Business Application: ${businessApplication}

Create habits that are:
1. Specific and measurable
2. Directly connected to the quote's message
3. A mix of personal and professional development

IMPORTANT: Format each habit as a bullet point:
• Habit name - X days

Example:
• Reflect on one passion for 5 minutes - 5 days
• Share one creative idea with team - 3 days
• Do one thing outside comfort zone - 2 days

Keep habit names under 8 words.`;
      break;

    case 'suggest-weekly':
      systemPrompt = `You are a habit coach helping someone plan their week. Based on their past habit performance, suggest which habits they should continue, modify, or try new. Be practical and encouraging.`;
      
      const { pastHabits } = req.body;
      
      const successfulHabits = (pastHabits || []).filter(h => h.successRate >= 70);
      const strugglingHabits = (pastHabits || []).filter(h => h.successRate < 50 && h.timesTracked >= 2);
      const moderateHabits = (pastHabits || []).filter(h => h.successRate >= 50 && h.successRate < 70);
      
      userPrompt = `${participant} is planning habits for the upcoming week. Here's their performance over the past 4 weeks:

**Successful habits (70%+ completion):**
${successfulHabits.map(h => `- ${h.habit}: ${h.successRate}% success (tracked ${h.timesTracked}x)`).join('\n') || 'None yet'}

**Moderate habits (50-70% completion):**
${moderateHabits.map(h => `- ${h.habit}: ${h.successRate}% success (tracked ${h.timesTracked}x)`).join('\n') || 'None yet'}

**Struggling habits (<50% completion):**
${strugglingHabits.map(h => `- ${h.habit}: ${h.successRate}% success (tracked ${h.timesTracked}x)`).join('\n') || 'None yet'}

Based on this data, suggest 5-7 habits for the upcoming week. Include:
1. Successful habits they should continue (keep the momentum!)
2. Modified versions of struggling habits (make them more achievable)
3. 1-2 new habits to try

IMPORTANT: Format each as a bullet point:
• Habit name - X days

Keep habit names short (under 8 words). Consider reducing days for struggling habits.`;
      break;

    case 'follow-up':
      systemPrompt = `You are a helpful accountability coach continuing a conversation. Be conversational, helpful, and concise. If suggesting habits, format them as bullet points with "• Habit - X days".`;
      
      // Build messages from conversation history
      messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      if (conversation && conversation.length > 0) {
        conversation.forEach(msg => {
          messages.push({ role: msg.role, content: msg.content });
        });
      }
      
      messages.push({ role: 'user', content: goal });
      
      // Skip the normal message building
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
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

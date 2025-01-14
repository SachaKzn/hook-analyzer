import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const WEEKLY_LIMIT = 5;
const RATE_LIMIT_WINDOW = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

export async function POST(req: Request) {
  try {
    const { hook } = await req.json();
    
    if (!hook) {
      return NextResponse.json({ error: 'Hook text is required' }, { status: 400 });
    }

    // Get client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const userIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    // Check usage limits
    const usageKey = `hook-analysis:${userIp}`;
    const currentUsage = await kv.get(usageKey) || { count: 0, timestamp: Date.now() };

    // Reset counter if outside the time window
    if (Date.now() - currentUsage.timestamp > RATE_LIMIT_WINDOW) {
      currentUsage.count = 0;
      currentUsage.timestamp = Date.now();
    }

    if (currentUsage.count >= WEEKLY_LIMIT) {
      return NextResponse.json({
        error: 'Weekly limit exceeded. Try again next week.',
        nextReset: new Date(currentUsage.timestamp + RATE_LIMIT_WINDOW).toISOString(),
      }, { status: 429 });
    }

    // Analyze hook using Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this ad hook for a wellness/health brand: "${hook}"
        
        Provide the following:
        1. A stake score (1-10) based on how well it communicates urgency and importance
        2. Brief feedback on the hook's effectiveness
        3. 3 specific suggestions for improvement
        4. 2 variations of the hook that might perform better
        
        Format your response as JSON with these keys: stakeScore, feedback, suggestions (array), variations (array)`,
      }],
    });

    // Parse Claude's response
    const analysis = JSON.parse(message.content[0].text);

    // Update usage counter
    await kv.set(usageKey, {
      count: currentUsage.count + 1,
      timestamp: currentUsage.timestamp,
    });

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Hook analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
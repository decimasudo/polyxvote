import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic so it runs fresh every time Vercel Cron triggers it
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("[CRON] 1. Starting Alpha Scan...");
    
    // 1. Fetch Top Trending Events from Polymarket
    const polyRes = await fetch(
      'https://gamma-api.polymarket.com/events?limit=10&active=true&closed=false&order=volume&descending=true'
    );
    const polyData = await polyRes.json();

    if (!polyData || polyData.length === 0) {
      console.log("[ERROR] No events found from Polymarket API");
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    let targetEvent = null;
    let marketDetails = null;

    // 2. Filter: Find a fresh event we haven't analyzed yet
    for (const event of polyData) {
      // Check Supabase: Have we logged this market_id before?
      const { data: existing } = await supabase
        .from('alpha_logs')
        .select('id')
        .eq('market_id', event.id)
        .single();

      if (existing) {
        // Skip if we already have this in our "Feed"
        continue;
      }

      // Validating Market Structure (Must have 2 outcomes: Yes/No)
      const market = event.markets?.[0];
      if (!market) continue;

      let outcomes;
      try {
        outcomes = typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
      } catch (e) { outcomes = []; }

      if (Array.isArray(outcomes) && outcomes.length === 2) {
        // Found a fresh target!
        targetEvent = event;
        marketDetails = market;
        break; 
      }
    }

    if (!targetEvent || !marketDetails) {
      console.log("[RESULT] No new events to analyze (Feed is up to date).");
      return NextResponse.json({ message: 'Feed is up to date.' });
    }

    // 3. Prepare Data for AI
    const title = targetEvent.title;
    let outcomePrices;
    try {
        outcomePrices = typeof marketDetails.outcomePrices === 'string' 
            ? JSON.parse(marketDetails.outcomePrices) 
            : marketDetails.outcomePrices;
    } catch (e) { outcomePrices = [0.5, 0.5]; }

    const probYes = Math.round(outcomePrices[0] * 100); 

    // 4. Generate "Chill Mate" Analysis (Inline AI Call)
    console.log(`[AI] Analyzing: ${title}`);
    
    let chillAnalysis = "market looks interesting.";
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://polyxvote.com", 
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-lite-preview-02-05:free", 
                    messages: [
                        {
                            role: "system",
                            content: `You are a crypto-native friend giving advice to a mate. 
                            Style: lowercase, casual, direct, use slang (sus, alpha, fade, send it). 
                            Constraint: NO EMOJIS. Max 200 chars. 
                            Task: Give a hot take on this prediction market. Always mention the odds.`
                        },
                        {
                            role: "user",
                            content: `Market: "${title}". Current Odds: ${probYes}% chance of happening.`
                        }
                    ]
                })
            });
            const aiJson = await aiRes.json();
            chillAnalysis = aiJson.choices?.[0]?.message?.content || chillAnalysis;
            // Clean up: Remove quotes if AI added them
            chillAnalysis = chillAnalysis.replace(/"/g, '').trim().toLowerCase();
        } catch (e) {
            console.error("[AI ERROR]", e);
        }
    }

    // 5. Save to Supabase (The "Feed")
    const { error: insertError } = await supabase
        .from('alpha_logs')
        .insert({
            market_id: targetEvent.id,
            market_title: title,
            market_slug: targetEvent.slug,
            chill_analysis: chillAnalysis,
            odds: probYes
        });

    if (insertError) {
        throw new Error(insertError.message);
    }

    console.log(`[SUCCESS] Added new alpha: ${title}`);

    return NextResponse.json({ 
      success: true, 
      data: {
        title: title,
        analysis: chillAnalysis,
        odds: probYes
      }
    });

  } catch (error: any) {
    console.error("[FATAL ERROR]", error); 
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
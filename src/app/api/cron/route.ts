import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic so it runs fresh every time Vercel Cron triggers it
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("[CRON] 1. Starting Alpha Scan...");
    
    // 1. Fetch Top Trending Events from Polymarket
    // Limit increased to 20 to ensure we find fresh events
    const polyRes = await fetch(
      'https://gamma-api.polymarket.com/events?limit=20&active=true&closed=false&order=volume&descending=true'
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

    // 4. Generate "Chill Mate" Analysis (Robust Error Handling)
    console.log(`[AI] Analyzing: ${title}`);
    
    let chillAnalysis = "market looks interesting."; // Default fallback
    
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
                    // Menggunakan model eksperimental yang biasanya lebih lenient/gratis
                    model: "mistralai/mistral-7b-instruct", 
                    messages: [
                        {
                            role: "system",
                            content: `You are a crypto trader texting a friend. 
                            Style: strict lowercase, no punctuation, use slang (ngmi, alpha, fade, send it, sus). 
                            Constraint: MAX 20 WORDS. NO EMOJIS.
                            Task: Give a cynical reason why the odds are wrong or right.`
                        },
                        {
                            role: "user",
                            content: `Event: "${title}". Odds: ${probYes}% Yes.`
                        }
                    ]
                })
            });

            if (!aiRes.ok) {
                const errText = await aiRes.text();
                console.error("[AI API ERROR]", errText);
            } else {
                const aiJson = await aiRes.json();
                const content = aiJson.choices?.[0]?.message?.content;
                
                if (content) {
                    // Bersihkan tanda kutip jika AI menambahkannya
                    chillAnalysis = content.replace(/"/g, '').trim().toLowerCase();
                } else {
                    console.error("[AI EMPTY RESPONSE]", aiJson);
                }
            }
        } catch (e) {
            console.error("[AI FETCH ERROR]", e);
        }
    } else {
        console.error("[AI KEY MISSING] Check .env.local OPENROUTER_API_KEY");
    }

    // 5. Save to Supabase (The "Feed")
    // Note: Pastikan kamu sudah menjalankan SQL "Allow public insert" di Supabase
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
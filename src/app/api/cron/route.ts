import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic agar selalu fresh saat Cron jalan
export const dynamic = 'force-dynamic';

// Fungsi Helper untuk delay (agar tidak kena Rate Limit AI)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
  try {
    console.log("[CRON] Starting Daily Top 6 Scan...");
    
    // 1. Fetch Top 6 Active Events dari Polymarket
    const polyRes = await fetch(
      'https://gamma-api.polymarket.com/events?limit=6&active=true&closed=false&order=volume&descending=true'
    );
    const polyData = await polyRes.json();

    if (!polyData || polyData.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    const results = [];

    // 2. Loop semua 6 Event
    for (const event of polyData) {
      // Validasi Market Binary (Yes/No)
      const market = event.markets?.[0];
      if (!market) continue;

      let outcomes;
      try {
        outcomes = typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
      } catch (e) { outcomes = []; }

      if (!Array.isArray(outcomes) || outcomes.length !== 2) continue;

      // Cek Duplikat di Database (Opsional: Kalau mau refresh total, bagian ini bisa disesuaikan)
      // Disini kita cek agar tidak double entry di hari yang sama
      const { data: existing } = await supabase
        .from('alpha_logs')
        .select('id')
        .eq('market_id', event.id)
        .single();

      if (existing) {
        console.log(`[SKIP] Market ${event.title} already exists.`);
        continue;
      }

      // Prepare Data
      const title = event.title;
      let outcomePrices;
      try {
          outcomePrices = typeof marketDetails.outcomePrices === 'string' 
              ? JSON.parse(marketDetails.outcomePrices) 
              : marketDetails.outcomePrices;
      } catch (e) { outcomePrices = [0.5, 0.5]; } // Fallback

      // Gunakan harga market jika ada, atau default
      const currentPrice = market.outcomePrices ? JSON.parse(market.outcomePrices)[0] : 0.5;
      const probYes = Math.round(currentPrice * 100);

      // 3. Generate Analysis dengan AI (Mistral)
      console.log(`[AI] Analyzing: ${title}`);
      let chillAnalysis = "market looks volatile."; // Fallback

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
                      model: "mistralai/mistral-7b-instruct:free", 
                      messages: [
                          {
                              role: "system",
                              content: `You are a crypto degen.
                              Style: strict lowercase, no punctuation, minimal words, slang (mid, cap, alpha, rekt).
                              Constraint: MAX 15 WORDS. NO EMOJIS.
                              Task: Give a cynical take on these odds.`
                          },
                          {
                              role: "user",
                              content: `Market: "${title}". Odds: ${probYes}% Yes.`
                          }
                      ]
                  })
              });

              if (aiRes.ok) {
                  const aiJson = await aiRes.json();
                  const content = aiJson.choices?.[0]?.message?.content;
                  if (content) {
                      chillAnalysis = content.replace(/"/g, '').trim().toLowerCase();
                  }
              }
          } catch (e) {
              console.error("[AI Error]", e);
          }
      }

      // 4. Save to Supabase
      const { error: insertError } = await supabase
          .from('alpha_logs')
          .insert({
              market_id: event.id,
              market_title: title,
              market_slug: event.slug,
              chill_analysis: chillAnalysis,
              odds: probYes
          });

      if (!insertError) {
          results.push(title);
          console.log(`[SUCCESS] Saved: ${title}`);
      }
      
      // Delay 2 detik antar request agar tidak kena Rate Limit AI
      await delay(2000);
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      markets: results 
    });

  } catch (error: any) {
    console.error("[FATAL ERROR]", error); 
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
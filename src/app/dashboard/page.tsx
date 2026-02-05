"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Terminal, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Check, 
  MessageSquare, 
  ArrowLeft,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';

// Types for our Feed Items
interface AlphaLog {
  id: number;
  market_title: string;
  market_slug: string;
  chill_analysis: string;
  odds: number;
  created_at: string;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<AlphaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Function to fetch the feed
  const fetchFeed = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alpha_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch last 50 items

    if (data) setLogs(data);
    if (error) console.error("Feed Error:", error);
    setLoading(false);
  };

  // Function to manually trigger a scan (Calls your Cron API)
  const triggerScan = async () => {
    setScanning(true);
    try {
      await fetch('/api/cron'); // Calls the engine we built in Step 4
      await fetchFeed(); // Refresh the list after scanning
    } catch (e) {
      console.error("Scan failed", e);
    }
    setScanning(false);
  };

  // Initial Load
  useEffect(() => {
    fetchFeed();
  }, []);

  // Copy Function for Admin
  const handleCopy = (log: AlphaLog) => {
    // Reconstruct the "Chill Mate" Tweet format
    const tweetText = `TRENDING: ${log.market_title}\n\nCONTEXT: ${log.chill_analysis}\n\nODDS: ${log.odds}%\n\n👇 What's the play? Vote below!`;
    
    navigator.clipboard.writeText(tweetText);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-blue-200">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
             <button className="p-2 border-2 border-transparent hover:border-black hover:shadow-hard-sm transition-none">
                <ArrowLeft size={20} />
             </button>
          </Link>
          <div className="flex items-center gap-2">
            <Terminal size={20} />
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-tighter">
              Alpha<span className="text-blue-600">Console</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={triggerScan} 
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black shadow-hard-sm hover:translate-y-1 hover:shadow-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-hard-sm"
          >
            <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
            <span className="text-[10px] font-bold uppercase hidden md:inline">
               {scanning ? "SCANNING..." : "FORCE SCAN"}
            </span>
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* METRICS ROW (The "Dashboard" Vibe) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <StatCard label="TOTAL SIGNALS" value={logs.length.toString()} icon={<Activity size={16}/>} />
           <StatCard label="WIN RATE (EST)" value="68%" icon={<BarChart3 size={16}/>} />
           <StatCard label="MODEL" value="GEMINI-2.0" icon={<Zap size={16}/>} />
           <StatCard label="STATUS" value="ONLINE" icon={<Check size={16}/>} active />
        </div>

        {/* FEED LIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-black pb-2 mb-6">
             <h2 className="text-sm font-bold uppercase flex items-center gap-2">
                <MessageSquare size={16} /> LIVE FEED
             </h2>
             <span className="text-[10px] font-bold text-gray-400">AUTO-REFRESH: 1H</span>
          </div>

          {loading && logs.length === 0 && (
             <div className="text-center py-20 animate-pulse text-xs font-bold">
                `{'>'}` FETCHING DATA FROM SUPABASE...
             </div>
          )}

          {logs.map((log) => (
            <article key={log.id} className="group relative bg-white border-4 border-black shadow-hard transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000]">
              
              {/* Card Header */}
              <div className="bg-gray-100 border-b-2 border-black p-3 flex justify-between items-start gap-4">
                 <h3 className="font-bold text-[10px] md:text-xs leading-relaxed uppercase">
                    {log.market_title}
                 </h3>
                 <span className={`shrink-0 text-white text-[10px] px-2 py-1 font-bold border-2 border-black shadow-hard-sm ${log.odds > 50 ? 'bg-green-600' : 'bg-red-500'}`}>
                    {log.odds}%
                 </span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                 <div className="flex gap-3 mb-4">
                    <span className="text-blue-600 font-bold">`{'>'}`</span>
                    <p className="text-xs leading-loose text-gray-800 lowercase font-bold">
                       {log.chill_analysis}
                    </p>
                 </div>
                 
                 {/* Footer Actions */}
                 <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                       <Clock size={12} />
                       {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>

                    <div className="flex gap-2">
                       {/* COPY BUTTON */}
                       <button 
                          onClick={() => handleCopy(log)}
                          className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase border-2 border-black transition-all ${
                             copiedId === log.id 
                             ? "bg-green-400 text-black shadow-none translate-y-1" 
                             : "bg-white hover:bg-gray-50 shadow-hard-sm hover:translate-y-1 hover:shadow-none"
                          }`}
                       >
                          {copiedId === log.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === log.id ? "COPIED" : "COPY"}
                       </button>

                       {/* VOTE BUTTON */}
                       <a 
                          href={`https://polymarket.com/event/${log.market_slug}`}
                          target="_blank"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase border-2 border-black shadow-hard-sm hover:translate-y-1 hover:shadow-none"
                       >
                          <ExternalLink size={12} /> VOTE
                       </a>
                    </div>
                 </div>
              </div>
            </article>
          ))}
        </div>

      </main>
    </div>
  );
}

// Sub-component for Stats
function StatCard({ label, value, icon, active }: { label: string, value: string, icon: any, active?: boolean }) {
   return (
      <div className="bg-white p-4 border-2 border-black shadow-hard flex flex-col justify-between h-24">
         <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <span className="text-black">{icon}</span>
         </div>
         <span className={`text-lg md:text-xl font-black tracking-tighter ${active ? 'text-green-600 animate-pulse' : 'text-black'}`}>
            {value}
         </span>
      </div>
   );
}
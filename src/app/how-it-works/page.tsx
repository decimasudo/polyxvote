"use client";

import Link from 'next/link';
import { 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  MessageSquare, 
  Share, 
  Database,
  Search,
  Zap
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-blue-200">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
             <button className="p-2 border-2 border-transparent hover:border-black hover:shadow-hard-sm transition-none">
                <ArrowLeft size={20} />
             </button>
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
                <Terminal size={16} />
             </div>
             <span className="font-bold uppercase tracking-tighter">THE PROTOCOL</span>
          </div>
        </div>
      </nav>

      {/* --- HERO HEADER --- */}
      <header className="py-20 border-b-4 border-black bg-gray-50">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-black uppercase mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
               How Poly<span className="text-blue-600">x</span>Vote Works
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-loose bg-white p-6 border-4 border-black shadow-hard transform -rotate-1">
               `{'>'}` WE DO NOT AUTOMATE SPAM.<br/>
               `{'>'}` WE AUTOMATE INTELLIGENCE.<br/>
               `{'>'}` YOU PROVIDE THE CONSENSUS.
            </p>
         </div>
      </header>

      {/* --- THE 3-STEP FLOW --- */}
      <main className="max-w-5xl mx-auto px-6 py-24">
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-2 bg-gray-200 -z-10" />

            {/* STEP 1: SCAN */}
            <StepCard 
               number="01"
               title="DATA INGESTION"
               icon={<Search size={32} />}
               desc="Our engine polls the Polymarket Gamma API hourly. We filter for high-volume, binary (Yes/No) markets to ensure liquidity and social interest."
               tag="AUTOMATED"
            />

            {/* STEP 2: SYNTHESIS */}
            <StepCard 
               number="02"
               title="CHILL SYNTHESIS"
               icon={<Cpu size={32} />}
               desc="Gemini 2.0 Flash ingest the market title and odds. We instruct it to adopt a 'Chill Mate' persona—direct, lowercase, no emojis, pure alpha."
               tag="AI POWERED"
            />

            {/* STEP 3: EXECUTION */}
            <StepCard 
               number="03"
               title="HUMAN EXECUTION"
               icon={<Share size={32} />}
               desc="The Alpha is queued in the Terminal. The Admin (You) reviews the feed, copies the text, and manually launches the Poll on X."
               tag="MANUAL"
            />
         </div>

         {/* --- TECHNICAL ARCHITECTURE VISUAL --- */}
         <div className="mt-32 border-4 border-black shadow-hard p-8 bg-blue-50">
            <h2 className="text-xl font-bold uppercase mb-12 text-center decoration-4 underline underline-offset-8 decoration-blue-500">
               System Architecture
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] md:text-xs font-bold text-center">
               
               {/* Node 1 */}
               <TechNode label="POLYMARKET API" icon={<Database size={20} />} color="bg-white" />
               <Arrow />
               
               {/* Node 2 */}
               <div className="p-6 bg-black text-white border-4 border-black shadow-hard-sm relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-1 text-[8px] border border-black">
                     CRON JOB
                  </div>
                  <Zap size={24} className="mx-auto mb-2 text-yellow-400" />
                  <div>NEXT.JS SERVER</div>
               </div>
               <Arrow />

               {/* Node 3 */}
               <TechNode label="SUPABASE DB" icon={<Database size={20} />} color="bg-green-100" />
               <Arrow />

               {/* Node 4 */}
               <TechNode label="ALPHA TERMINAL" icon={<Terminal size={20} />} color="bg-white" />
            </div>
         </div>

         {/* --- CTA --- */}
         <div className="mt-24 text-center">
            <Link href="/dashboard">
               <button className="px-12 py-6 bg-blue-600 text-white text-lg font-bold uppercase border-4 border-black shadow-hard hover:translate-y-1 hover:shadow-none transition-none">
                  ACCESS THE TERMINAL
               </button>
            </Link>
         </div>

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StepCard({ number, title, icon, desc, tag }: { number: string, title: string, icon: any, desc: string, tag: string }) {
   return (
      <div className="bg-white p-8 border-4 border-black shadow-hard relative hover:-translate-y-2 transition-transform">
         <div className="absolute -top-6 left-6 text-6xl font-black text-gray-100 -z-10">
            {number}
         </div>
         <div className="w-16 h-16 bg-gray-100 border-2 border-black flex items-center justify-center mb-6">
            {icon}
         </div>
         <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase">{title}</h3>
            <span className="text-[8px] bg-black text-white px-2 py-1">{tag}</span>
         </div>
         <p className="text-xs leading-loose text-gray-600">
            {desc}
         </p>
      </div>
   );
}

function TechNode({ label, icon, color }: any) {
   return (
      <div className={`w-32 p-4 border-2 border-black shadow-hard-sm ${color}`}>
         <div className="flex justify-center mb-2">{icon}</div>
         <div>{label}</div>
      </div>
   );
}

function Arrow() {
   return (
      <div className="hidden md:block text-gray-400">
         ----------------&gt;
      </div>
   );
}
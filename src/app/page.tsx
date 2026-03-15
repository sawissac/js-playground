import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconCodeDots, IconRocket, IconBrandReact } from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden selection:bg-blue-500/30">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20">
              <IconCodeDots size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              js-playground
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/editor" 
              className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-slate-950 hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            js-playground v0.1.0 is now live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 [text-wrap:balance]">
            Visual Logic Editor for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Modern Web</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            Design powerful state diagrams, manage contextual variables dynamically, 
            and export robust JSON package footprints instantly—all visually.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
            <Link 
              href="/editor" 
              className="group h-12 px-8 inline-flex items-center justify-center rounded-lg text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
            >
              Open Workspace
              <IconArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Banner Image Presentation */}
        <div className="mt-24 relative rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-1000 delay-700">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4 rounded-2xl ring-1 ring-white/10">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Image 
                src="/banner.png" 
                alt="Antigravity Flow Editor Interface" 
                fill 
                className="object-cover object-center scale-[1.01] hover:scale-100 transition-transform duration-700 ease-out"
                priority
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
          
          {[
            {
              icon: IconBrandReact,
              title: "React Powered",
              desc: "Built entirely with React and Redux architectures for blazing fast state rendering.",
              color: "text-sky-400",
              bg: "bg-sky-400/10",
              ring: "ring-sky-400/20"
            },
            {
              icon: IconCodeDots,
              title: "Turing Complete",
              desc: "Supports looping, conditional pipelines, cross-function mutations, and Async JS execution.",
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
              ring: "ring-emerald-400/20"
            },
            {
              icon: IconRocket,
              title: "Export Anywhere",
              desc: "Export precise payload models matching your JSON schemas directly into production bundles.",
              color: "text-purple-400",
              bg: "bg-purple-400/10",
              ring: "ring-purple-400/20"
            }
          ].map((feature, i) => (
            <div key={i} className="relative group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors overflow-hidden">
              <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 ring-1 ring-inset ${feature.ring} group-hover:scale-110 transition-transform`}>
                <feature.icon size={24} className={feature.color} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/50 mt-20">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© 2026 js-playground. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

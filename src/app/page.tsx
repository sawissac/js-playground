"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconCodeDots,
  IconRocket,
  IconBrandReact,
  IconChartBar,
  IconBrandD3,
  IconSparkles,
  IconVariable,
  IconFunction,
  IconPlayerPlay,
  IconCloud,
  IconFileExport,
  IconBoxMultiple,
  IconGitBranch,
  IconBolt,
  IconPalette,
  IconCode,
} from "@tabler/icons-react";
import RendererDialog from "@/features/renderer";
import { Provider } from "react-redux";
import { store } from "@/state/store";
import { DEMO_PACKAGES } from "@/lib/demoPackages";
import { loadDemoPackage } from "@/state/slices/editorSlice";

export default function Home() {
  const [rendererOpen, setRendererOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleDemoClick = (demoKey: string) => {
    const demoPackage = DEMO_PACKAGES[demoKey];
    if (demoPackage) {
      store.dispatch(loadDemoPackage(demoPackage));
      setSelectedPackage(demoKey);
      setRendererOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-background to-muted pointer-events-none" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <IconCodeDots size={20} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              js-playground
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/editor"
              className="h-9 px-6 inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
              <IconArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <IconBolt size={14} />
            js-playground v0.1.0 — Open Source Visual Logic Editor
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 [text-wrap:balance]">
            Visual Logic Editor for the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
              Modern Web
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            A sophisticated visual programming environment for designing state
            diagrams, managing contextual variables dynamically, and exporting
            robust JSON package footprints—all with a modern, accessible UI
            built on React and Redux.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
            <Link
              href="/editor"
              className="group h-12 px-8 inline-flex items-center justify-center rounded-full text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <IconRocket size={18} className="mr-2" />
              Open Workspace
              <IconArrowRight
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 inline-flex items-center justify-center rounded-full text-base font-medium border-2 border-border hover:bg-muted transition-colors"
            >
              <IconCode size={18} className="mr-2" />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build sophisticated visual logic flows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

            {[
              {
                icon: IconVariable,
                title: "Typed Variables",
                desc: "Define variables with typed values including string, number, boolean, array, and object types. Real-time type validation ensures data integrity.",
                color: "text-blue-600",
                bg: "bg-blue-500/10",
                ring: "ring-blue-500/20",
              },
              {
                icon: IconFunction,
                title: "Reusable Functions",
                desc: "Create powerful function pipelines with action sequences. Support for temp variables, math operations, conditionals, and nested loops.",
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
                ring: "ring-emerald-500/20",
              },
              {
                icon: IconPlayerPlay,
                title: "Execution Flows",
                desc: "Build runners with set, call, and code steps. Execute async JavaScript with full CDN library support and dynamic variable updates.",
                color: "text-purple-600",
                bg: "bg-purple-500/10",
                ring: "ring-purple-500/20",
              },
              {
                icon: IconCloud,
                title: "CDN Libraries",
                desc: "Load external libraries dynamically from CDN sources. Built-in support for d3, lodash, three.js, chart.js, and custom packages.",
                color: "text-orange-600",
                bg: "bg-orange-500/10",
                ring: "ring-orange-500/20",
              },
              {
                icon: IconFileExport,
                title: "Import & Export",
                desc: "Export projects as JSON for backup or sharing. Import existing configurations to continue work or collaborate with others.",
                color: "text-pink-600",
                bg: "bg-pink-500/10",
                ring: "ring-pink-500/20",
              },
              {
                icon: IconBoxMultiple,
                title: "Package System",
                desc: "Organize code into multiple packages within a single project. Enable or disable packages, reorder execution, and manage dependencies.",
                color: "text-indigo-600",
                bg: "bg-indigo-500/10",
                ring: "ring-indigo-500/20",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="relative group rounded-2xl border border-border bg-background p-6 hover:shadow-lg hover:border-primary/50 transition-all overflow-hidden"
              >
                <div
                  className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 ring-1 ring-inset ${feature.ring} group-hover:scale-110 transition-transform`}
                >
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Packages */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent-foreground mb-4">
              <IconSparkles size={14} />
              Live Demos
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Packages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore interactive visualizations and demos created with
              js-playground. Click any card to see it in action with responsive
              rendering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "D3 Bar Chart",
                desc: "Interactive bar chart with smooth animations",
                icon: IconChartBar,
                color: "from-blue-500 to-cyan-500",
                preview: "bg-gradient-to-br from-blue-50 to-cyan-50",
                demoKey: "d3-bar-chart",
              },
              {
                title: "Data Visualization",
                desc: "Dynamic network graph with D3.js",
                icon: IconBrandD3,
                color: "from-orange-500 to-red-500",
                preview: "bg-gradient-to-br from-orange-50 to-red-50",
                demoKey: "data-visualization",
              },
              {
                title: "Creative Canvas",
                desc: "Generative art with canvas animations",
                icon: IconSparkles,
                color: "from-purple-500 to-pink-500",
                preview: "bg-gradient-to-br from-purple-50 to-pink-50",
                demoKey: "creative-canvas",
              },
            ].map((pkg, i) => (
              <button
                key={i}
                onClick={() => handleDemoClick(pkg.demoKey)}
                className="group relative rounded-2xl border border-border bg-background p-6 hover:shadow-xl hover:border-primary/50 transition-all text-left overflow-hidden"
              >
                <div
                  className={`absolute inset-0 ${pkg.preview} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <pkg.icon size={24} className="text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {pkg.desc}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    <IconPlayerPlay size={14} />
                    <span>View Demo</span>
                    <IconArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <IconCodeDots size={20} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">js-playground</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                A sophisticated visual programming environment for the modern
                web. Build, test, and export logic flows with ease.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a
                  href="/editor"
                  className="block hover:text-foreground transition-colors"
                >
                  Editor
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a
                  href="https://github.com"
                  className="block hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Discord
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 js-playground. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                License
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Renderer Dialog */}
      <Provider store={store}>
        <RendererDialog open={rendererOpen} onOpenChange={setRendererOpen} />
      </Provider>
    </div>
  );
}

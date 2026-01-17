import React from 'react';
import { ExternalLink, Code2, Database, LayoutTemplate } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          About <span className="text-blue-600 dark:text-blue-400">Score Boxes</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          A comprehensive analytics dashboard for NFL statistics, providing real-time game data, advanced metrics, and matchup analysis.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-800 dark:text-slate-200">
          <Code2 className="w-8 h-8 text-indigo-500" />
          <h2>The Tech Stack</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">Frontend Framework</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Built with <span className="font-semibold text-slate-900 dark:text-white">Next.js 16 (App Router)</span> and <span className="font-semibold text-slate-900 dark:text-white">React 19</span> for server-side rendering and high performance.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">Styling</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Styled using <span className="font-semibold text-slate-900 dark:text-white">Tailwind CSS</span> for a modern, responsive design with dark mode support, and <span className="font-semibold text-slate-900 dark:text-white">Lucide React</span> for iconography.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">Language</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Developed entirely in <span className="font-semibold text-slate-900 dark:text-white">TypeScript</span> to ensure type safety and code reliability.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">Data Processing</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Utilizes <span className="font-semibold text-slate-900 dark:text-white">PapaParse</span> for efficient CSV parsing of large datasets and server-side scraping techniques for live metrics.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-800 dark:text-slate-200">
          <Database className="w-8 h-8 text-indigo-500" />
          <h2>Data Sources</h2>
        </div>
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">ESPN APIs</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              The primary engine for real-time data, including live scores, game schedules, play-by-play updates, and official team standings. This dashboard leverages multiple internal ESPN endpoints to provide up-to-the-minute accuracy.
            </p>
          </div>

          <a 
            href="https://github.com/nflverse/nflverse-data" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">nflverse (nflfastR)</h3>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Utilized for historical data analysis and advanced season-long metrics. This open-source repository provides the granular data necessary for deep-dive team comparisons.
            </p>
          </a>
        </div>
      </section>
      
      <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Score Boxes. All rights reserved.</p>
      </footer>
    </div>
  );
}

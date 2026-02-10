export function StickyColumnHeader() {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-x-4 sm:gap-x-6 py-2 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm sticky top-0 z-10">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">
        Offense
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">
        Defense
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  primaryColor,
  darkAccentColor,
}: {
  label: string;
  value: string;
  primaryColor: string;
  darkAccentColor: string;
}) {
  return (
    <div
      className="text-center py-1.5 px-2 rounded-lg"
      style={{
        backgroundColor: `color-mix(in srgb, ${primaryColor} 6%, transparent)`,
      }}
    >
      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-base font-bold">
        <span className="dark:hidden" style={{ color: primaryColor }}>
          {value}
        </span>
        <span
          className="hidden dark:inline"
          style={{ color: darkAccentColor }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function RecordSection({
  record,
  homeRecord,
  awayRecord,
  divRecord,
  primaryColor,
  darkAccentColor,
}: {
  record: string;
  homeRecord: string;
  awayRecord: string;
  divRecord: string;
  primaryColor: string;
  darkAccentColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Team color accent stripe */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${darkAccentColor})`,
        }}
      />
      <div className="px-4 pt-3 pb-3">
        <h3
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: primaryColor }}
        >
          <span className="dark:hidden">Record</span>
          <span
            className="hidden dark:inline"
            style={{ color: darkAccentColor }}
          >
            Record
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <SummaryCard
            label="Overall"
            value={record}
            primaryColor={primaryColor}
            darkAccentColor={darkAccentColor}
          />
          <SummaryCard
            label="Home"
            value={homeRecord}
            primaryColor={primaryColor}
            darkAccentColor={darkAccentColor}
          />
          <SummaryCard
            label="Away"
            value={awayRecord}
            primaryColor={primaryColor}
            darkAccentColor={darkAccentColor}
          />
          <SummaryCard
            label="Division"
            value={divRecord}
            primaryColor={primaryColor}
            darkAccentColor={darkAccentColor}
          />
        </div>
      </div>
    </div>
  );
}

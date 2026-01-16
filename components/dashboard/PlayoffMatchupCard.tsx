import { PlayoffTeam } from "@/types/nfl";
import { SafeImage } from "../common/SafeImage";

interface PlayoffMatchupCardProps {
    homeTeam: PlayoffTeam;
    awayTeam: PlayoffTeam;
}

const TeamDisplay = ({ team, alignment }: { team: PlayoffTeam, alignment: 'left' | 'right' }) => (
    <div className={`flex items-center gap-2 sm:gap-3 ${alignment === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
        <SafeImage
            src={team.logoUrl}
            alt={team.name}
            width={24}
            height={24}
            className="w-6 h-6 sm:w-8 sm:h-8"
            initials={team.abbreviation}
            fallbackClassName="rounded-full"
        />
        <div className={`${alignment === 'right' ? 'text-right' : 'text-left'} min-w-0`}>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">{team.record}</p>
            <p className="font-semibold text-xs sm:text-sm text-slate-700 truncate">{team.name}</p>
        </div>
    </div>
);

export const PlayoffMatchupCard = ({ homeTeam, awayTeam }: PlayoffMatchupCardProps) => {
    return (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <span className="font-black text-slate-400 text-xs sm:text-sm flex-shrink-0">{awayTeam.seed}</span>
                    <TeamDisplay team={awayTeam} alignment="left" />
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-300 flex-shrink-0">@</div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
                    <TeamDisplay team={homeTeam} alignment="right" />
                    <span className="font-black text-slate-400 text-xs sm:text-sm flex-shrink-0">{homeTeam.seed}</span>
                </div>
            </div>
        </div>
    )
}
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { UserIcon } from "lucide-react";

// Generate consistent color from string
function getAvatarColor(name: string): string {
    const colors = [
        "bg-gradient-to-br from-rose-400 to-pink-600",
        "bg-gradient-to-br from-violet-400 to-purple-600",
        "bg-gradient-to-br from-blue-400 to-indigo-600",
        "bg-gradient-to-br from-cyan-400 to-teal-600",
        "bg-gradient-to-br from-emerald-400 to-green-600",
        "bg-gradient-to-br from-amber-400 to-orange-600",
        "bg-gradient-to-br from-red-400 to-rose-600",
    ];
    const hash = name
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Team colors
const teamColors = [
    {
        bg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
        border: "border-blue-200 dark:border-blue-800",
        header: "text-blue-700 dark:text-blue-300",
    },
    {
        bg: "bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30",
        border: "border-rose-200 dark:border-rose-800",
        header: "text-rose-700 dark:text-rose-300",
    },
    {
        bg: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
        header: "text-emerald-700 dark:text-emerald-300",
    },
    {
        bg: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30",
        border: "border-amber-200 dark:border-amber-800",
        header: "text-amber-700 dark:text-amber-300",
    },
];

type TeamAssignmentViewProps = {
    users: { id: string; name: string }[];
    teams: string[][];
};

export default function TeamAssignmentView({
    users,
    teams,
}: TeamAssignmentViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team, teamIdx) => {
                const colors = teamColors[teamIdx % teamColors.length];
                return (
                    <div
                        key={teamIdx}
                        className={`flex flex-col gap-3 p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className={`font-semibold text-sm uppercase tracking-wide ${colors.header}`}
                            >
                                Team {teamIdx + 1}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                                {team.length} player
                                {team.length !== 1 ? "s" : ""}
                            </Badge>
                        </div>
                        {team.length === 0 ? (
                            <div className="flex items-center gap-2 text-zinc-400 text-sm py-2">
                                <UserIcon className="w-4 h-4" />
                                No players assigned
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {team.map((playerId) => {
                                    const user = users.find(
                                        (u) => u.id === playerId
                                    );
                                    const name = user?.name || "Unknown";
                                    return (
                                        <div
                                            key={playerId}
                                            className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-zinc-900/50 rounded-lg"
                                        >
                                            <Avatar
                                                className={`w-7 h-7 ${getAvatarColor(
                                                    name
                                                )}`}
                                            >
                                                <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                                                    {getInitials(name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                                {name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

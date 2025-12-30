import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { SaveIcon, ShuffleIcon, XIcon, UserIcon } from "lucide-react";

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

type TeamAssignmentEditorProps = {
    users: { id: string; name: string }[];
    teams: string[][];
    numTeams: number;
    playersPerTeam: number;
    onUpdateTeams: (teams: string[][]) => void;
};

export default function TeamAssignmentEditor({
    users,
    teams,
    numTeams,
    playersPerTeam,
    onUpdateTeams,
}: TeamAssignmentEditorProps) {
    const [localTeams, setLocalTeams] = useState<string[][]>(
        teams.length === numTeams
            ? teams.map((t) => [...t])
            : Array.from({ length: numTeams }, () => [])
    );

    // Socket/context for randomize
    const { socket, connected } = useWebSocket();
    const { roomId, userId } = useSession();

    // Unassigned users
    const assigned = new Set(localTeams.flat());
    const unassigned = users.filter((u) => !assigned.has(u.id));

    // Handle assignment
    function handleAssign(
        selectedUserId: string,
        teamIdx: number,
        slotIdx: number
    ) {
        setLocalTeams((prev) => {
            // Remove user from any team
            const newTeams = prev.map((team) =>
                team.filter((id) => id !== selectedUserId)
            );
            // Assign to new slot
            newTeams[teamIdx][slotIdx] = selectedUserId;
            return newTeams;
        });
    }

    // Remove from team
    function handleRemove(teamIdx: number, slotIdx: number) {
        setLocalTeams((prev) => {
            const newTeams = prev.map((team) => [...team]);
            newTeams[teamIdx][slotIdx] = "";
            return newTeams;
        });
    }

    // Save teams
    function handleSave() {
        // Clean up empty slots
        const cleaned = localTeams.map((team) => team.filter(Boolean));
        onUpdateTeams(cleaned);
        toast.success("Teams saved!");
    }

    // Ensure correct shape if numTeams/playersPerTeam changes
    useEffect(() => {
        setLocalTeams((prev) => {
            let newTeams = prev.slice(0, numTeams);
            while (newTeams.length < numTeams) newTeams.push([]);
            newTeams = newTeams.map((team) => {
                const t = team.slice(0, playersPerTeam);
                while (t.length < playersPerTeam) t.push("");
                return t;
            });
            return newTeams;
        });
    }, [numTeams, playersPerTeam]);

    useEffect(() => {
        setLocalTeams(
            teams.length === numTeams
                ? teams.map((t) => [...t])
                : Array.from({ length: numTeams }, () => [])
        );
    }, [teams, numTeams]);

    function handleRandomize() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("randomize_teams", { roomId, userId });
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Teams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localTeams.map((team, teamIdx) => {
                    const colors = teamColors[teamIdx % teamColors.length];
                    return (
                        <div
                            key={teamIdx}
                            className={`flex flex-col gap-3 p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}
                        >
                            <div
                                className={`font-semibold text-sm uppercase tracking-wide ${colors.header}`}
                            >
                                Team {teamIdx + 1}
                            </div>
                            {team.map((playerId, slotIdx) => {
                                const player = users.find(
                                    (u) => u.id === playerId
                                );
                                return (
                                    <div
                                        key={slotIdx}
                                        className="flex items-center gap-2"
                                    >
                                        <select
                                            className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm"
                                            value={playerId}
                                            onChange={(e) =>
                                                handleAssign(
                                                    e.target.value,
                                                    teamIdx,
                                                    slotIdx
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select player...
                                            </option>
                                            {users.map((u) => (
                                                <option
                                                    key={u.id}
                                                    value={u.id}
                                                    disabled={
                                                        !!assigned.has(u.id) &&
                                                        playerId !== u.id
                                                    }
                                                >
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                        {playerId && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                onClick={() =>
                                                    handleRemove(
                                                        teamIdx,
                                                        slotIdx
                                                    )
                                                }
                                                type="button"
                                                title="Remove from team"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Unassigned Players */}
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                    <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">
                        Unassigned Players
                    </span>
                    <Badge variant="secondary" className="text-xs">
                        {unassigned.length}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                    {unassigned.length === 0 ? (
                        <span className="text-sm text-zinc-400">
                            All players assigned!
                        </span>
                    ) : (
                        unassigned.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700"
                            >
                                <Avatar
                                    className={`w-6 h-6 ${getAvatarColor(
                                        u.name
                                    )}`}
                                >
                                    <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                                        {getInitials(u.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    {u.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={handleSave}
                    type="button"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                >
                    <SaveIcon className="w-4 h-4" />
                    Save Teams
                </Button>
                <Button
                    onClick={handleRandomize}
                    type="button"
                    variant="outline"
                    className="border-zinc-300 dark:border-zinc-600"
                >
                    <ShuffleIcon className="w-4 h-4" />
                    Randomize Teams
                </Button>
            </div>
        </div>
    );
}

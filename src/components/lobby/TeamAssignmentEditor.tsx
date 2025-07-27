import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

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
    function handleAssign(userId: string, teamIdx: number, slotIdx: number) {
        setLocalTeams((prev) => {
            // Remove user from any team
            const newTeams = prev.map((team) =>
                team.filter((id) => id !== userId)
            );
            // Assign to new slot
            newTeams[teamIdx][slotIdx] = userId;
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6">
                {localTeams.map((team, teamIdx) => (
                    <div
                        key={teamIdx}
                        className="flex flex-col gap-3 p-4 border rounded-lg min-w-[180px] bg-zinc-50 dark:bg-zinc-800 shadow-sm"
                    >
                        <div className="font-semibold text-lg  mb-1">
                            Team {teamIdx + 1}
                        </div>
                        {team.map((userId, slotIdx) => (
                            <div
                                key={slotIdx}
                                className="flex items-center gap-2"
                            >
                                <select
                                    className="border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-400 transition"
                                    value={userId}
                                    onChange={(e) =>
                                        handleAssign(
                                            e.target.value,
                                            teamIdx,
                                            slotIdx
                                        )
                                    }
                                >
                                    <option value="">
                                        -- Select Player --
                                    </option>
                                    {users.map((u) => (
                                        <option
                                            key={u.id}
                                            value={u.id}
                                            disabled={
                                                !!assigned.has(u.id) &&
                                                userId !== u.id
                                            }
                                        >
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                                {userId && (
                                    <button
                                        className="text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full w-6 h-6 flex items-center justify-center transition"
                                        onClick={() =>
                                            handleRemove(teamIdx, slotIdx)
                                        }
                                        type="button"
                                        title="Remove from team"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div>
                <div className="font-semibold mb-1 text-zinc-700 dark:text-zinc-200">
                    Unassigned Players:
                </div>
                <div className="flex flex-wrap gap-2">
                    {unassigned.length === 0 ? (
                        <span className="text-zinc-400">None</span>
                    ) : (
                        unassigned.map((u) => (
                            <span
                                key={u.id}
                                className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-full font-medium text-zinc-800 dark:text-zinc-100 shadow"
                            >
                                {u.name}
                            </span>
                        ))
                    )}
                </div>
            </div>
            <div className="flex gap-4 mt-2">
                <button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition text-white rounded-lg font-semibold shadow"
                    onClick={handleSave}
                    type="button"
                >
                    Save Teams
                </button>
                <button
                    className="px-4 py-2 bg-zinc-500 hover:bg-zinc-600 transition text-white rounded-lg font-semibold shadow"
                    onClick={handleRandomize}
                    type="button"
                >
                    Randomize Teams
                </button>
            </div>
        </div>
    );
}

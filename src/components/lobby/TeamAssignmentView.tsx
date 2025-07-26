type TeamAssignmentViewProps = {
    users: { id: string; name: string }[];
    teams: string[][];
};

export default function TeamAssignmentView({
    users,
    teams,
}: TeamAssignmentViewProps) {
    return (
        <div className="flex flex-wrap gap-4">
            {teams.map((team, teamIdx) => (
                <div
                    key={teamIdx}
                    className="flex flex-col gap-2 p-2 border rounded min-w-[150px]"
                >
                    <div className="font-semibold">Team {teamIdx + 1}</div>
                    {team.length === 0 ? (
                        <span className="text-zinc-500">No players</span>
                    ) : (
                        team.map((userId) => {
                            const user = users.find((u) => u.id === userId);
                            return (
                                <span
                                    key={userId}
                                    className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded"
                                >
                                    {user ? user.name : userId}
                                </span>
                            );
                        })
                    )}
                </div>
            ))}
        </div>
    );
}

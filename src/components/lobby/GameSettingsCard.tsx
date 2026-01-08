// src/components/lobby/GameSettingsCard.tsx
// Game-specific settings component that appears below AvailableGamesCard

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { SettingsIcon, InfoIcon } from "lucide-react";
import { GameSettings } from "@/types/lobby";

export interface DominoesSettings {
    winTarget: number;
    drawFromBoneyard: boolean;
}

export interface SpadesSettings {
    winTarget: number;
    allowNil: boolean;
    blindNilEnabled: boolean;
    bagsPenalty: number;
}

interface GameSettingsCardProps {
    gameType: string | null;
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    isLeader: boolean;
}

const DEFAULT_DOMINOES_SETTINGS: DominoesSettings = {
    winTarget: 100,
    drawFromBoneyard: false,
};

const DEFAULT_SPADES_SETTINGS: SpadesSettings = {
    winTarget: 500,
    allowNil: true,
    blindNilEnabled: false,
    bagsPenalty: -100,
};

export default function GameSettingsCard({
    gameType,
    settings,
    onSettingsChange,
    isLeader,
}: GameSettingsCardProps) {
    const handleChange = useCallback(
        <T,>(key: string, value: T) => {
            if (!isLeader) return;
            onSettingsChange({ ...settings, [key]: value });
        },
        [isLeader, settings, onSettingsChange]
    );

    if (!gameType) {
        return null;
    }

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <SettingsIcon className="w-4 h-4 text-amber-500" />
                    {gameType === "dominoes" ? "Dominoes" : "Spades"} Settings
                    {!isLeader && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                            View only
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {gameType === "dominoes" && (
                    <DominoesSettingsForm
                        settings={{
                            ...DEFAULT_DOMINOES_SETTINGS,
                            ...(settings as Partial<DominoesSettings>),
                        }}
                        onChange={handleChange}
                        disabled={!isLeader}
                    />
                )}
                {gameType === "spades" && (
                    <SpadesSettingsForm
                        settings={{
                            ...DEFAULT_SPADES_SETTINGS,
                            ...(settings as Partial<SpadesSettings>),
                        }}
                        onChange={handleChange}
                        disabled={!isLeader}
                    />
                )}
            </CardContent>
        </Card>
    );
}

interface DominoesSettingsFormProps {
    settings: DominoesSettings;
    onChange: <T>(key: string, value: T) => void;
    disabled: boolean;
}

function DominoesSettingsForm({
    settings,
    onChange,
    disabled,
}: DominoesSettingsFormProps) {
    return (
        <div className="space-y-4">
            {/* Win Target */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="dominoes-winTarget"
                        className="text-sm font-medium"
                    >
                        Win Target
                    </Label>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {settings.winTarget} points
                    </span>
                </div>
                <Slider
                    id="dominoes-winTarget"
                    min={50}
                    max={500}
                    step={25}
                    value={[settings.winTarget]}
                    onValueChange={([value]) => onChange("winTarget", value)}
                    disabled={disabled}
                    className="w-full"
                />
                <p className="text-xs text-zinc-500">
                    First team to reach this score wins the game.
                </p>
            </div>

            {/* Draw From Boneyard */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor="dominoes-drawFromBoneyard"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Draw from Boneyard
                    </Label>
                    <SettingInfoTooltip content="When enabled, players can draw tiles from the boneyard instead of passing. Caribbean block dominoes traditionally has this disabled." />
                </div>
                <Switch
                    id="dominoes-drawFromBoneyard"
                    checked={settings.drawFromBoneyard}
                    onCheckedChange={(checked: boolean) =>
                        onChange("drawFromBoneyard", checked)
                    }
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

interface SpadesSettingsFormProps {
    settings: SpadesSettings;
    onChange: <T>(key: string, value: T) => void;
    disabled: boolean;
}

function SpadesSettingsForm({
    settings,
    onChange,
    disabled,
}: SpadesSettingsFormProps) {
    return (
        <div className="space-y-4">
            {/* Win Target */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="spades-winTarget"
                        className="text-sm font-medium"
                    >
                        Win Target
                    </Label>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {settings.winTarget} points
                    </span>
                </div>
                <Slider
                    id="spades-winTarget"
                    min={100}
                    max={1000}
                    step={50}
                    value={[settings.winTarget]}
                    onValueChange={([value]) => onChange("winTarget", value)}
                    disabled={disabled}
                    className="w-full"
                />
                <p className="text-xs text-zinc-500">
                    First team to reach this score wins the game.
                </p>
            </div>

            {/* Allow Nil */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor="spades-allowNil"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Allow Nil Bids
                    </Label>
                    <SettingInfoTooltip content="Players can bid nil (0 tricks). Making nil earns +100 points, failing costs -100 points." />
                </div>
                <Switch
                    id="spades-allowNil"
                    checked={settings.allowNil}
                    onCheckedChange={(checked: boolean) =>
                        onChange("allowNil", checked)
                    }
                    disabled={disabled}
                />
            </div>

            {/* Blind Nil */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor="spades-blindNilEnabled"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Allow Blind Nil
                    </Label>
                    <SettingInfoTooltip content="Players can bid blind nil before seeing their cards. Worth +200 if made, -200 if failed. Advanced strategy option." />
                </div>
                <Switch
                    id="spades-blindNilEnabled"
                    checked={settings.blindNilEnabled}
                    onCheckedChange={(checked: boolean) =>
                        onChange("blindNilEnabled", checked)
                    }
                    disabled={disabled || !settings.allowNil}
                />
            </div>

            {/* Bags Penalty */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="spades-bagsPenalty"
                            className="text-sm font-medium"
                        >
                            Bags Penalty
                        </Label>
                        <SettingInfoTooltip content="Points deducted when a team accumulates 10 overtricks (bags). Set to 0 to disable bag penalties." />
                    </div>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {settings.bagsPenalty} points
                    </span>
                </div>
                <Slider
                    id="spades-bagsPenalty"
                    min={-200}
                    max={0}
                    step={10}
                    value={[settings.bagsPenalty]}
                    onValueChange={([value]) => onChange("bagsPenalty", value)}
                    disabled={disabled}
                    className="w-full"
                />
                <p className="text-xs text-zinc-500">
                    {settings.bagsPenalty === 0
                        ? "Bag penalties disabled"
                        : `${Math.abs(
                              settings.bagsPenalty
                          )} points deducted per 10 bags`}
                </p>
            </div>
        </div>
    );
}

function SettingInfoTooltip({ content }: { content: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <InfoIcon className="w-3.5 h-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{content}</p>
            </TooltipContent>
        </Tooltip>
    );
}

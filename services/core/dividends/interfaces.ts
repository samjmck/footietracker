import { PlayerPosition } from "./enums";

export interface BuzzScoreboard {
    [playerId: string]: number;
}

export interface BuzzByDay {
    [time: number]: number;
}

export interface TopBuzz {
    [time: number]: BuzzScoreboard;
}

export interface PerformanceBuzzScoreboard {
    [PlayerPosition.Forward]: BuzzScoreboard;
    [PlayerPosition.Midfielder]: BuzzScoreboard;
    [PlayerPosition.Defender]: BuzzScoreboard;
    [PlayerPosition.Goalkeeper]: BuzzScoreboard;
    all: BuzzScoreboard;
}


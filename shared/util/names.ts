export function getPlayerId(name: string): string {
    return name.replace(/ /g, '-').toLowerCase();
}

export function getPlayerName(playerId: string): string {
    return playerId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export class SaveSystem {
    constructor() {
        this.storageKey = 'abyss_adventurer_save';
        this.leaderboardKey = 'abyss_adventurer_leaderboard';
    }

    saveRun(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadRun() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    clearRun() {
        localStorage.removeItem(this.storageKey);
    }

    saveScore(name, score, level) {
        const leaderboard = this.getLeaderboard();
        leaderboard.push({ name, score, level, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.leaderboardKey, JSON.stringify(leaderboard.slice(0, 10))); // Top 10
    }

    getLeaderboard() {
        const data = localStorage.getItem(this.leaderboardKey);
        return data ? JSON.parse(data) : [];
    }
}

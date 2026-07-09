'use client';

import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <LeaderboardPanel />
      </div>
    </div>
  );
}

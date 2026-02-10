'use client';

import MatchInterface from '@/components/MatchInterface';

interface ChatTabProps {
  onMatchAccepted: (session: any) => void;
}

export default function ChatTab({ onMatchAccepted }: ChatTabProps) {
  return (
    <div>
      <MatchInterface onMatchAccepted={onMatchAccepted} />
    </div>
  );
}


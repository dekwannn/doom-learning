'use client';
import { useState } from 'react';
import FeedContainer from '@/components/Feed/FeedContainer';
import PlayHeader from '@/components/Layout/PlayHeader';
import OnboardingGuide from '@/components/OnboardingGuide';
import allDummyData from '@/data/dummyData.json';

interface Props {
  params: { levelId: string };
}

export default function PlayLevel({ params }: Props) {
  const levelId = params.levelId;
  const levelDataObj = allDummyData[levelId as keyof typeof allDummyData] || allDummyData['1' as keyof typeof allDummyData];
  const levelData = Array.isArray(levelDataObj) ? levelDataObj : Object.values(levelDataObj)[0] || [];
  const [showGuide, setShowGuide] = useState(true);

  return (
    <main className="bg-zinc-900 min-h-screen flex items-center justify-center">
      <div className="relative w-full sm:max-w-md h-screen bg-black overflow-hidden shadow-2xl sm:border-x sm:border-zinc-800">

        <PlayHeader onGuide={() => setShowGuide(true)} />

        <FeedContainer initialData={levelData} />

        {showGuide && (
          <OnboardingGuide
            feedData={levelData}
            onDone={() => setShowGuide(false)}
          />
        )}
      </div>
    </main>
  );
}
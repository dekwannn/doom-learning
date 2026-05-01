// src/components/Feed/FeedContainer.tsx
'use client';

import { useState } from 'react';
import VocabularyCard from '../Cards/VocabularyCard';
import QuizCard from '../Cards/QuizCard';
import SentenceBuildingCard from '../Cards/SentenceBuildingCard';
import ListeningQuizCard from '../Cards/ListeningQuizCard';
import SpeakingCard from '../Cards/SpeakingCard';
import MatchingCard from '../Cards/MatchingCard';
import RewardCard from '../Cards/RewardCard';
import MemeCard from '../Cards/MemeCard';
import DailyTargetCard from '../Cards/DailyTargetCard';

export default function FeedContainer({ initialData }: { initialData: any[] }) {
  const [feed] = useState(initialData);

  const renderCard = (item: any) => {
    switch (item.type) {
      case 'vocabulary':
        return <VocabularyCard data={item.content} />;
      case 'fill_in_blank':
      case 'translation_quiz':
      case 'mini_conversation':
        return <QuizCard data={item.content} xpReward={item.xpReward} type={item.type} />;
      case 'sentence_building':
        return <SentenceBuildingCard data={item.content} xpReward={item.xpReward} />;
      case 'listening_quiz':
        return <ListeningQuizCard data={item.content} xpReward={item.xpReward} />;
      case 'speaking_test':
        return <SpeakingCard data={item.content} xpReward={item.xpReward} />;
      case 'matching_word':
        return <MatchingCard data={item.content} xpReward={item.xpReward} />;
      case 'reward':
        return <RewardCard data={item.content} xpReward={item.xpReward} />;
      case 'meme':
        return <MemeCard data={item.content} />;
      case 'daily_target':
        return <DailyTargetCard data={item.content} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            Tipe card tidak didukung
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full sm:max-w-md mx-auto bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative shadow-2xl">
      {feed.map((item) => (
        <div key={item.id} className="h-screen w-full snap-start snap-always relative">
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}
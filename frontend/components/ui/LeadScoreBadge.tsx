import React from 'react';
import { SparklesIcon } from '../icons/IconComponents';

interface LeadScoreBadgeProps {
  score: number;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor()}`}>
      <SparklesIcon className="w-4 h-4 mr-1.5" />
      <span>{score}</span>
    </div>
  );
};

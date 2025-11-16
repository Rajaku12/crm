import React from 'react';
import { StarIcon } from '../icons/IconComponents';

interface StarRatingProps {
  score: number;
  maxScore?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ score, maxScore = 5 }) => {
  return (
    <div className="flex items-center" title={`Score: ${score} out of ${maxScore}`}>
      {[...Array(maxScore)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${
              starValue <= score ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
};

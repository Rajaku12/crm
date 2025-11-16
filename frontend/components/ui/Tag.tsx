
import React from 'react';
import { LeadTag, LeadStatus } from '../../types';

interface TagProps {
  type: LeadTag | LeadStatus;
}

const tagColorMap: { [key in LeadTag | LeadStatus]: string } = {
  [LeadTag.Hot]: 'bg-red-100 text-red-800',
  [LeadTag.Warm]: 'bg-yellow-100 text-yellow-800',
  [LeadTag.Cold]: 'bg-blue-100 text-blue-800',
  [LeadStatus.New]: 'bg-indigo-100 text-indigo-800',
  [LeadStatus.Contacted]: 'bg-cyan-100 text-cyan-800',
  [LeadStatus.SiteVisit]: 'bg-purple-100 text-purple-800',
  [LeadStatus.Negotiation]: 'bg-orange-100 text-orange-800',
  [LeadStatus.Approved]: 'bg-sky-100 text-sky-800',
  [LeadStatus.Closed]: 'bg-green-100 text-green-800',
  [LeadStatus.Rejected]: 'bg-pink-100 text-pink-800',
  [LeadStatus.Lost]: 'bg-gray-100 text-gray-800',
};

export const Tag: React.FC<TagProps> = ({ type }) => {
  const colorClasses = tagColorMap[type] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
      {type}
    </span>
  );
};

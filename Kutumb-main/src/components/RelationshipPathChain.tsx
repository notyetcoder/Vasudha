'use client';

import React from 'react';
import { User } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { ArrowRight } from 'lucide-react';

interface RelationshipPathChainProps {
  path: User[];
  relationshipLabels: string[]; // Gujarati labels for each step
  gujaratiName: string;
  englishName: string;
}

export function RelationshipPathChain({
  path,
  relationshipLabels,
  gujaratiName,
  englishName,
}: RelationshipPathChainProps) {
  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
      {/* Title */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {gujaratiName}
        </h3>
        <p className="text-sm text-gray-600">{englishName}</p>
      </div>

      {/* Path Visualization */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-4">
          {path.map((person, idx) => (
            <React.Fragment key={person.id}>
              {/* Person Card */}
              <div className="flex flex-col items-center gap-2">
                <UserAvatar user={person} size="lg" />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-900">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-600">{person.surname}</p>
                  {idx > 0 && relationshipLabels[idx - 1] && (
                    <p className="text-xs font-medium text-blue-600 mt-1">
                      {relationshipLabels[idx - 1]}
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {idx < path.length - 1 && (
                <div className="flex flex-col items-center gap-1 px-2">
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                  {relationshipLabels[idx] && (
                    <p className="text-xs text-center text-gray-600 max-w-16">
                      {relationshipLabels[idx]}
                    </p>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-4">
        <div className="flex-1 p-3 bg-white rounded border border-gray-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{path.length}</p>
          <p className="text-xs text-gray-600">Total People</p>
        </div>
        <div className="flex-1 p-3 bg-white rounded border border-gray-200 text-center">
          <p className="text-2xl font-bold text-purple-600">{path.length - 1}</p>
          <p className="text-xs text-gray-600">Steps</p>
        </div>
      </div>
    </div>
  );
}

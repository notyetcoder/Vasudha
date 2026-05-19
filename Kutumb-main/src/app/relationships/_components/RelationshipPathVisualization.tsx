'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  relationship: any;
  users: User[];
}

export default function RelationshipPathVisualization({
  relationship,
  users,
}: Props) {
  const userMap = new Map(users.map(u => [u.id, u]));

  if (!relationship.found) {
    return (
      <Card className="border-2 border-red-200 bg-red-50 shadow-lg">
        <CardContent className="pt-8">
          <div className="flex items-center gap-4 text-center">
            <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-lg font-semibold text-red-900">Not Related</p>
              <p className="text-red-700 mt-1">{relationship.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
            <CardTitle className="text-2xl">✨ Connection Found!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-2 tracking-wider">
              RELATIONSHIP TYPE
            </p>
            <p className="text-4xl font-bold text-green-700">
              {relationship.relationship}
            </p>
            {relationship.distance && relationship.distance > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {relationship.distance} connection{relationship.distance !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
            <p className="text-lg font-semibold text-gray-900 leading-relaxed">
              {relationship.explanation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Path Visualization */}
      {relationship.path && relationship.path.length > 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📍 Connection Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop View - Horizontal Path */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="flex items-center gap-2 justify-center py-8 min-w-min px-4">
                {relationship.path.map((node: any, index: number) => {
                  const user = userMap.get(node.userId);
                  const isLast = index === relationship.path.length - 1;

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="text-center flex-shrink-0">
                        {user?.profilePictureUrl && (
                          <img
                            src={user.profilePictureUrl}
                            alt={user.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-3 border-purple-300 shadow-md"
                          />
                        )}
                        <p className="font-semibold text-sm w-20 truncate">
                          {user?.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-1 mx-auto inline-block bg-purple-100 text-purple-800"
                        >
                          {node.relation}
                        </Badge>
                      </div>

                      {!isLast && (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="text-2xl">→</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile View - Vertical Path */}
            <div className="sm:hidden space-y-4">
              {relationship.path.map((node: any, index: number) => {
                const user = userMap.get(node.userId);
                const isLast = index === relationship.path.length - 1;

                return (
                  <div key={index}>
                    <div className="text-center">
                      {user?.profilePictureUrl && (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border-3 border-purple-300"
                        />
                      )}
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1 mx-auto inline-block bg-purple-100 text-purple-800"
                      >
                        {node.relation}
                      </Badge>
                    </div>

                    {!isLast && (
                      <div className="flex justify-center text-2xl my-2">↓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Connection Type</p>
              <p className="text-2xl font-bold text-blue-600">
                {relationship.relationship}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Degrees of Separation</p>
              <p className="text-2xl font-bold text-blue-600">
                {relationship.distance}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

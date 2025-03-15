'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamDetails } from '@/app/dashboard/[teamId]/page';
import { cn } from '@/lib/utils';

interface TeamNarrativeProps {
  teamDetails: TeamDetails | null;
  isLoading: boolean;
}

export default function TeamNarrative({ teamDetails, isLoading }: TeamNarrativeProps) {
  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded-full animate-pulse"></div>
            團隊介紹
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded-full w-5/6 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teamDetails) {
    return null;
  }

  // Construct team information display
  const teamMembers = teamDetails.members?.map(member => 
    `${member.name_zh}${member.name_en ? ` (${member.name_en})` : ''}`
  ).join('、') || '無成員資料';

  // Format presentation time if available
  const presentationTime = teamDetails.presentation_time 
    ? new Date(teamDetails.presentation_time).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '未安排';

  // Simple renderer for newlines in project narrative
  const renderNarrative = (text?: string) => {
    if (!text) return '尚無項目說明。';
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full mb-6 overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span className={cn(
              "flex-shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium rounded",
              "bg-primary/15 text-primary"
            )}>
              #{teamDetails.index}
            </span>
            團隊介紹 - {teamDetails.team_name}
          </CardTitle>
          <CardDescription>團隊基本信息和參賽作品概述</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Team Status */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">評分狀態</div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  teamDetails.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {teamDetails.active ? '可評分' : '已截止'}
                </span>
                
                {teamDetails.current_votes !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    已收到 {teamDetails.current_votes} 份評分
                  </span>
                )}
              </div>
            </div>

            {/* Team Presentation Time - Only show if available */}
            {teamDetails.presentation_time && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">演示時間</div>
                <div className="text-sm font-medium">{presentationTime}</div>
              </div>
            )}
            
            {/* Team Members */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">團隊成員</div>
              <div className="text-sm">{teamMembers}</div>
            </div>
            
            {/* Team Brief Description */}
            {teamDetails.description && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">簡短描述</div>
                <div className="text-sm font-medium">{teamDetails.description}</div>
              </div>
            )}
            
            {/* Team Project Narrative */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">項目詳細介紹</div>
              <div className="text-sm bg-muted/20 p-3 rounded-md whitespace-pre-line">
                {renderNarrative(teamDetails.project_narrative)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 
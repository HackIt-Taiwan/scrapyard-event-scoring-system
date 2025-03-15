'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import type { Team, ScoreSubmission } from '@/lib/api-client';

interface ScoringPanelProps {
  team: Team;
  onScoreSubmit: (submission: ScoreSubmission) => Promise<boolean>;
}

interface ScoreCategory {
  id: string;
  name: string;
  description: string;
  value: number;
  weight: number;
  maxScore: number; // Maximum possible score for this category
}

export default function ScoringPanel({ team, onScoreSubmit }: ScoringPanelProps) {
  const [scores, setScores] = useState<ScoreCategory[]>([
    {
      id: 'creativity',
      name: '創新性',
      description: '強調創意、實驗精神及打破常規的思維，解決問題的方式與構思的獨特性',
      value: 25,
      weight: 0.5, // 50%
      maxScore: 50, // 50 out of 100 total points
    },
    {
      id: 'completeness',
      name: '完整度',
      description: '評估是否能實現並展示項目的基本功能，並具備實際可操作性',
      value: 15,
      weight: 0.3, // 30%
      maxScore: 30, // 30 out of 100 total points
    },
    {
      id: 'presentation',
      name: '簡報表達能力',
      description: '評估如何清晰、有說服力地介紹項目，並展示對作品的理解',
      value: 10,
      weight: 0.2, // 20%
      maxScore: 20, // 20 out of 100 total points
    },
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [resultMessage, setResultMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const handleScoreChange = (id: string, value: number[]) => {
    setScores(scores.map(score => 
      score.id === id ? { ...score, value: value[0] } : score
    ));
  };
  
  const handleSubmit = async () => {
    if (submitting || !team.canVote) return;
    
    setSubmitting(true);
    setResultMessage(null);
    
    try {
      // Prepare score submission
      const submission: ScoreSubmission = {
        team_id: team.team_id,
        scores: {
          // Convert scores to 1-10 scale for API compatibility
          creativity: Math.round((scores.find(s => s.id === 'creativity')?.value || 25) / 5),
          completeness: Math.round((scores.find(s => s.id === 'completeness')?.value || 15) / 3),
          presentation: Math.round((scores.find(s => s.id === 'presentation')?.value || 10) / 2),
        },
        feedback: feedback || undefined,
      };
      
      const success = await onScoreSubmit(submission);
      
      if (success) {
        setResultMessage({
          type: 'success',
          text: '評分提交成功！'
        });
        
        // Reset form for next team
        setScores(scores.map(score => ({ 
          ...score, 
          value: score.maxScore / 2 // Reset to half of max score
        })));
        setFeedback('');
      } else {
        setResultMessage({
          type: 'error',
          text: '評分提交失敗，請重試。'
        });
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      setResultMessage({
        type: 'error',
        text: '發生錯誤，請重試。'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate total score (simple sum, no weighting needed as weights are built into max scores)
  const totalScore = scores.reduce((sum, score) => sum + score.value, 0);
  const maxPossibleScore = 100; // Total max score is 100
  const scorePercentage = (totalScore / maxPossibleScore) * 100;
  
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Team Header */}
      <motion.div 
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold">{team.team_name}</h1>
        <p className="text-muted-foreground mt-1">請為此團隊評分</p>
      </motion.div>
      
      {/* Result Message (if any) */}
      {resultMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${
            resultMessage.type === 'success' 
              ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {resultMessage.text}
        </motion.div>
      )}
      
      {/* Scoring Categories */}
      <div className="space-y-6">
        {scores.map((category) => (
          <motion.div 
            key={category.id}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">{category.name} <span className="text-sm text-muted-foreground">({Math.round(category.weight * 100)}%)</span></h2>
              <span className="text-2xl font-bold">{category.value} / {category.maxScore}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
            
            <Slider
              value={[category.value]}
              min={0}
              max={category.maxScore}
              step={1}
              onValueChange={(value) => handleScoreChange(category.id, value)}
              className="py-4"
              disabled={!team.canVote || submitting}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>較差</span>
              <span>一般</span>
              <span>優秀</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Feedback */}
      <motion.div 
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-lg font-semibold mb-2">反饋意見 (選填)</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="請輸入您對此團隊的反饋意見..."
          className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none"
          disabled={!team.canVote || submitting}
        />
      </motion.div>
      
      {/* Summary and Submit */}
      <motion.div 
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">總分</h2>
          <span className="text-2xl font-bold">{totalScore} / {maxPossibleScore}</span>
        </div>

        {/* Score progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={submitting || !team.canVote}
          onClick={handleSubmit}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              提交中...
            </span>
          ) : team.canVote ? '提交評分' : '已完成評分'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';

// Vote types for AI models
type VoteType = 'BUY' | 'SELL' | 'HOLD' | null;

// Individual model vote data
interface ModelVote {
  modelId: string;
  modelName: string;
  icon: string;
  color: string;
  vote: VoteType;
  confidence: number;
  isLoading: boolean;
}

// Consensus snapshot containing all model votes
interface ConsensusSnapshot {
  models: ModelVote[];
  timestamp?: number;
}

// Component props interface
interface CouncilVotesProps {
  consensusSnapshot: ConsensusSnapshot;
  entrySignal: 'BUY' | 'SELL' | null;
}

// Model definitions - 5 AI models with their branding
const MODEL_DEFINITIONS: Omit<ModelVote, 'vote' | 'confidence' | 'isLoading'>[] = [
  {
    modelId: 'deepseek',
    modelName: 'DeepSeek',
    icon: '🔮',
    color: '#6366f1', // Indigo
  },
  {
    modelId: 'kimi',
    modelName: 'Kimi',
    icon: '🌙',
    color: '#8b5cf6', // Violet
  },
  {
    modelId: 'minimax',
    modelName: 'MiniMax',
    icon: '⚡',
    color: '#22c55e', // Green
  },
  {
    modelId: 'glm',
    modelName: 'GLM',
    icon: '🧠',
    color: '#10b981', // Emerald
  },
  {
    modelId: 'gemini',
    modelName: 'Gemini',
    icon: '♊',
    color: '#eab308', // Yellow
  },
];

// Vote indicator component
function VoteIndicator({ 
  vote, 
  isLoading 
}: { 
  vote: VoteType; 
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <motion.div
        className="w-5 h-5 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        role="status"
        aria-live="polite"
        aria-label="Loading vote"
      >
        <svg 
          className="w-4 h-4 text-muted-foreground" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
    );
  }

  const indicators = {
    BUY: { symbol: '▲', color: 'text-bullish', label: 'Buy' },
    SELL: { symbol: '▼', color: 'text-bearish', label: 'Sell' },
    HOLD: { symbol: '—', color: 'text-neutral', label: 'Hold' },
  };

  if (!vote) {
    return (
      <span className="text-neutral text-sm font-medium" aria-label="No vote yet">
        —
      </span>
    );
  }

  const indicator = indicators[vote];
  
  return (
    <span 
      className={`${indicator.color} text-sm font-bold`}
      aria-label={`${indicator.label} vote`}
    >
      {indicator.symbol}
    </span>
  );
}

// Individual model vote card
function ModelVoteCard({ 
  model, 
  isHighlighted 
}: { 
  model: ModelVote; 
  isHighlighted: boolean;
}) {
  const voteStatusText = model.isLoading
    ? 'is voting'
    : model.vote
    ? `voted ${model.vote} with ${model.confidence}% confidence`
    : 'has not voted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center gap-1.5 p-2 rounded-lg min-w-[64px]
        transition-all duration-200
        ${isHighlighted 
          ? 'bg-primary/10 ring-1 ring-primary/50 shadow-sm' 
          : 'bg-secondary/50 hover:bg-secondary'
        }
      `}
      role="article"
      aria-label={`${model.modelName} ${voteStatusText}`}
    >
      {/* Model Icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ 
          backgroundColor: `${model.color}20`,
          border: `1.5px solid ${model.color}60`
        }}
        aria-hidden="true"
      >
        {model.icon}
      </div>

      {/* Model Name */}
      <span className="text-[10px] font-medium text-muted-foreground truncate max-w-full">
        {model.modelName}
      </span>

      {/* Vote Indicator */}
      <div className="h-5 flex items-center justify-center">
        <VoteIndicator vote={model.vote} isLoading={model.isLoading} />
      </div>

      {/* Confidence % */}
      <span className="text-[10px] font-semibold tabular-nums">
        {model.isLoading ? (
          <span className="text-muted-foreground" aria-label="Loading">...</span>
        ) : model.vote ? (
          <span className={isHighlighted ? 'text-primary' : 'text-foreground'} aria-label={`${model.confidence} percent confidence`}>
            {model.confidence}%
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </span>
    </motion.div>
  );
}

// Calculate consensus summary
function calculateConsensus(models: ModelVote[]): {
  text: string;
  hasConsensus: boolean;
  consensusVote: VoteType;
  agreementCount: number;
} {
  const validVotes = models.filter(m => !m.isLoading && m.vote !== null);
  
  if (validVotes.length === 0) {
    return {
      text: 'No consensus yet',
      hasConsensus: false,
      consensusVote: null,
      agreementCount: 0,
    };
  }

  const voteCounts: Record<string, number> = {};
  validVotes.forEach(m => {
    voteCounts[m.vote!] = (voteCounts[m.vote!] || 0) + 1;
  });

  // Find the most common vote
  let maxCount = 0;
  let consensusVote: VoteType = null;
  
  (Object.keys(voteCounts) as VoteType[]).forEach(vote => {
    if (voteCounts[vote!] > maxCount) {
      maxCount = voteCounts[vote!];
      consensusVote = vote;
    }
  });

  const hasConsensus = maxCount >= 3; // At least 3 out of 5 agree
  const totalModels = models.length;
  
  let text: string;
  if (hasConsensus && consensusVote) {
    text = `Consensus: ${maxCount}/${totalModels} agree on ${consensusVote}`;
  } else if (validVotes.length < totalModels) {
    text = `Waiting for ${totalModels - validVotes.length} more vote${totalModels - validVotes.length > 1 ? 's' : ''}...`;
  } else {
    text = 'No clear consensus';
  }

  return {
    text,
    hasConsensus,
    consensusVote,
    agreementCount: maxCount,
  };
}

// Main component
export default function CouncilVotes({ 
  consensusSnapshot, 
  entrySignal 
}: CouncilVotesProps) {
  // Merge model definitions with snapshot data
  const models: ModelVote[] = MODEL_DEFINITIONS.map(def => {
    const snapshotModel = consensusSnapshot.models.find(m => m.modelId === def.modelId);
    return {
      ...def,
      vote: snapshotModel?.vote ?? null,
      confidence: snapshotModel?.confidence ?? 0,
      isLoading: snapshotModel?.isLoading ?? true,
    };
  });

  const consensus = calculateConsensus(models);

  return (
    <div className="w-full space-y-3" role="region" aria-label="AI Council Votes">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">AI Council</h3>
        <span className="text-xs text-muted-foreground">
          {models.filter(m => !m.isLoading).length}/{models.length} voted
        </span>
      </div>

      {/* Models Row */}
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        {models.map((model) => {
          const isHighlighted = entrySignal !== null && model.vote === entrySignal;
          return (
            <ModelVoteCard
              key={model.modelId}
              model={model}
              isHighlighted={isHighlighted}
            />
          );
        })}
      </div>

      {/* Consensus Summary */}
      <div className="pt-2 border-t border-border">
        <p 
          className={`
            text-xs font-medium text-center
            ${consensus.hasConsensus 
              ? consensus.consensusVote === 'BUY' 
                ? 'text-bullish'
                : consensus.consensusVote === 'SELL'
                  ? 'text-bearish'
                  : 'text-neutral'
              : 'text-muted-foreground'
            }
          `}
        >
          {consensus.text}
        </p>
      </div>
    </div>
  );
}

// Export types for consumers
export type { CouncilVotesProps, ConsensusSnapshot, ModelVote, VoteType };

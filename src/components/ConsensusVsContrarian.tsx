'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { SkeletonBox } from './LoadingSkeleton';

interface TVLData {
  cvault: number;
  dissent: number;
  timestamp: string;
  ratio?: number;
}

interface ConsensusVsContrarianProps {
  cvaultTVL?: number;
  dissentTVL?: number;
  historicalData?: TVLData[];
  isLoading?: boolean;
}

// Mock historical data for the chart with ratio calculation
const MOCK_HISTORICAL_DATA: TVLData[] = [
  { cvault: 120000, dissent: 45000, timestamp: '2024-01-01' },
  { cvault: 135000, dissent: 52000, timestamp: '2024-01-08' },
  { cvault: 118000, dissent: 61000, timestamp: '2024-01-15' },
  { cvault: 142000, dissent: 48000, timestamp: '2024-01-22' },
  { cvault: 156000, dissent: 55000, timestamp: '2024-01-29' },
  { cvault: 168000, dissent: 49000, timestamp: '2024-02-05' },
  { cvault: 175000, dissent: 52000, timestamp: '2024-02-12' },
  { cvault: 182000, dissent: 58000, timestamp: '2024-02-19' },
  { cvault: 195000, dissent: 51000, timestamp: '2024-02-26' },
  { cvault: 203000, dissent: 47000, timestamp: '2024-03-05' },
  { cvault: 215000, dissent: 49000, timestamp: '2024-03-12' },
  { cvault: 228000, dissent: 52000, timestamp: '2024-03-19' },
].map(d => ({
  ...d,
  ratio: Math.round((d.cvault / (d.cvault + d.dissent)) * 100)
}));

const MOCK_CVAULT_TVL = 228000;
const MOCK_DISSENT_TVL = 52000;

// Loading skeleton for the component
function ConsensusVsContrarianSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBox height="h-7" className="w-64 mb-2" />
          <SkeletonBox height="h-4" className="w-48" />
        </div>
        <SkeletonBox height="h-5" className="w-5 rounded-full" />
      </div>

      {/* TVL Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bullish/10 border border-bullish/20 rounded-lg p-4 space-y-2">
          <SkeletonBox height="h-5" className="w-32" />
          <SkeletonBox height="h-8" className="w-24" />
          <SkeletonBox height="h-4" className="w-20" />
        </div>
        <div className="bg-bearish/10 border border-bearish/20 rounded-lg p-4 space-y-2">
          <SkeletonBox height="h-5" className="w-32" />
          <SkeletonBox height="h-8" className="w-24" />
          <SkeletonBox height="h-4" className="w-20" />
        </div>
      </div>

      {/* Market Belief Index Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBox height="h-5" className="w-32" />
          <SkeletonBox height="h-4" className="w-24" />
        </div>
        <div className="text-center space-y-2">
          <SkeletonBox height="h-10" className="w-32 mx-auto" />
          <SkeletonBox height="h-4" className="w-24 mx-auto" />
        </div>
        <SkeletonBox height="h-12" className="w-full rounded-full" />
        <div className="flex items-center justify-center gap-6">
          <SkeletonBox height="h-4" className="w-24" />
          <SkeletonBox height="h-4" className="w-24" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="space-y-3">
        <SkeletonBox height="h-5" className="w-32" />
        <SkeletonBox height="h-64" className="w-full" />
      </div>

      {/* Key Insights Skeleton */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <SkeletonBox height="h-5" className="w-24 mb-3" />
        <SkeletonBox height="h-4" className="w-full" />
        <SkeletonBox height="h-4" className="w-full" />
        <SkeletonBox height="h-4" className="w-3/4" />
      </div>
    </div>
  );
}

export default function ConsensusVsContrarian({
  cvaultTVL = MOCK_CVAULT_TVL,
  dissentTVL = MOCK_DISSENT_TVL,
  historicalData = MOCK_HISTORICAL_DATA,
  isLoading = false,
}: ConsensusVsContrarianProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate Market Belief Index
  const totalTVL = cvaultTVL + dissentTVL;
  const consensusPercentage = Math.round((cvaultTVL / totalTVL) * 100);
  const contrarianPercentage = 100 - consensusPercentage;

  // Generate ratio display text
  const getRatioText = () => {
    if (consensusPercentage >= 80) return 'Overwhelming AI Trust';
    if (consensusPercentage >= 70) return 'Strong AI Preference';
    if (consensusPercentage >= 60) return 'Moderate AI Trust';
    if (consensusPercentage >= 40) return 'Balanced Sentiment';
    return 'Contrarian Dominance';
  };

  // Get sentiment description
  const getSentimentDescription = () => {
    if (consensusPercentage >= 80) return 'Market shows extreme confidence in AI consensus decisions';
    if (consensusPercentage >= 70) return 'Strong market preference for AI-driven strategies';
    if (consensusPercentage >= 60) return 'Moderate trust in AI recommendations';
    if (consensusPercentage >= 40) return 'Market sentiment is evenly split between strategies';
    return 'Market favors contrarian positions over AI consensus';
  };

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cvaultValue = payload[0]?.value || 0;
      const dissentValue = payload[1]?.value || 0;
      const total = cvaultValue + dissentValue;
      const ratio = total > 0 ? Math.round((cvaultValue / total) * 100) : 50;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[280px] sm:max-w-xs">
          <p className="text-sm font-medium text-foreground mb-2 truncate">
            {new Date(label).toLocaleDateString('en-US', { 
              month: isMobile ? 'short' : 'long', 
              day: 'numeric', 
              year: isMobile ? undefined : 'numeric' 
            })}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-bullish flex items-center justify-between gap-2 sm:gap-4">
              <span className="truncate">Consensus TVL:</span>
              <span className="font-semibold whitespace-nowrap">${(cvaultValue / 1000).toFixed(isMobile ? 0 : 1)}K</span>
            </p>
            <p className="text-sm text-bearish flex items-center justify-between gap-2 sm:gap-4">
              <span className="truncate">Contrarian TVL:</span>
              <span className="font-semibold whitespace-nowrap">${(dissentValue / 1000).toFixed(isMobile ? 0 : 1)}K</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground truncate">
              Market Belief: <span className="font-semibold text-foreground">{ratio}%</span> AI Trust
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Info tooltip component
  const InfoTooltip = ({ content, children, position = 'bottom' }: { 
    content: string; 
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }) => {
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-border',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-border',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-border',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-border',
    };

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setActiveTooltip(content)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        {children}
        {activeTooltip === content && (
          <div className={`absolute z-50 ${positionClasses[position]} px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs`}>
            <p className="text-sm text-foreground">{content}</p>
            <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
          </div>
        )}
      </div>
    );
  };

  if (isLoading || !mounted) {
    return <ConsensusVsContrarianSkeleton />;
  }

  return (
    <div className="bg-card rounded-xl p-3 sm:p-6 border border-border space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden" style={{maxWidth: '100vw', boxSizing: 'border-box'}}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">Consensus vs Contrarian</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Market sentiment analysis based on TVL distribution
          </p>
        </div>
        <InfoTooltip 
          content="The Consensus vs Contrarian ratio is a unique sentiment indicator that measures market trust in AI-driven decision making. Higher values indicate greater confidence in AI consensus recommendations."
          position="left"
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center cursor-help transition-colors">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </InfoTooltip>
      </div>

      {/* TVL Comparison Panel - Side by Side Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full" style={{minWidth: 0}}>
        {/* Consensus Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-bullish/10 border border-bullish/20 rounded-lg p-3 sm:p-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-bullish/5 rounded-full -mr-8 -mt-8 sm:-mr-10 sm:-mt-10" />
          <div className="flex items-center justify-between mb-1 sm:mb-2 relative z-10">
            <h3 className="font-semibold text-bullish flex items-center gap-1 text-xs sm:text-sm sm:gap-2">
              <span className="text-sm sm:text-lg">🤝</span>
              <span className="truncate">$CVAULT</span>
            </h3>
            <span className="text-xs font-medium text-bullish bg-bullish/20 px-1.5 sm:px-2 py-1 rounded-full whitespace-nowrap text-xs">
              Consensus
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bullish mb-1 relative z-10">
            ${cvaultTVL.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground relative z-10">
            {consensusPercentage}% of total TVL
          </div>
          <div className="mt-1 sm:mt-2 text-xs text-bullish/80 relative z-10">
            Capital following AI consensus
          </div>
        </motion.div>

        {/* Contrarian Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-bearish/10 border border-bearish/20 rounded-lg p-3 sm:p-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-bearish/5 rounded-full -mr-8 -mt-8 sm:-mr-10 sm:-mt-10" />
          <div className="flex items-center justify-between mb-1 sm:mb-2 relative z-10">
            <h3 className="font-semibold text-bearish flex items-center gap-1 text-xs sm:text-sm sm:gap-2">
              <span className="text-sm sm:text-lg">⚡</span>
              <span className="truncate">$DISSENT</span>
            </h3>
            <span className="text-xs font-medium text-bearish bg-bearish/20 px-1.5 sm:px-2 py-1 rounded-full whitespace-nowrap text-xs">
              Contrarian
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-bearish mb-1 relative z-10">
            ${dissentTVL.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground relative z-10">
            {contrarianPercentage}% of total TVL
          </div>
          <div className="mt-1 sm:mt-2 text-xs text-bearish/80 relative z-10">
            Capital betting against AI
          </div>
        </motion.div>
      </div>

      {/* Market Belief Index - Enhanced Visual Gauge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Market Belief Index</h3>
            <InfoTooltip 
              content="This unique sentiment indicator shows the percentage of capital allocated to AI consensus vs contrarian strategies. It reflects real market confidence in AI-driven trading decisions."
              position="top"
            >
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-help underline decoration-dotted">
                What is this?
              </span>
            </InfoTooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Total TVL:</span>
            <span className="text-sm font-semibold">${(totalTVL / 1000).toFixed(0)}K</span>
          </div>
        </div>
        
        {/* Main Index Display */}
        <div className="text-center py-2 sm:py-3 lg:py-4 bg-gradient-to-b from-muted/50 to-transparent rounded-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2">
              {consensusPercentage}% <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-muted-foreground">Trust AI</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              {getRatioText()}
            </div>
            <div className="text-xs text-muted-foreground max-w-sm sm:max-w-md mx-auto px-2">
              {getSentimentDescription()}
            </div>
          </motion.div>
        </div>

        {/* Visual Gauge/Bar */}
        <div className="relative">
          <div className="relative h-14 bg-secondary rounded-full overflow-hidden shadow-inner">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 51px)'
              }} />
            </div>

            {/* Consensus (AI Trust) portion */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-bullish to-bullish-light flex items-center justify-end pr-4"
              initial={{ width: '0%' }}
              animate={{ width: `${consensusPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            >
              {consensusPercentage >= 25 && (
                <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                  {consensusPercentage}%
                </span>
              )}
            </motion.div>

            {/* Contrarian portion */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-bearish to-bearish-light flex items-center justify-start pl-4"
              initial={{ width: '0%' }}
              animate={{ width: `${contrarianPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
            >
              {contrarianPercentage >= 25 && (
                <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                  {contrarianPercentage}%
                </span>
              )}
            </motion.div>

            {/* Center divider with glow */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/80 transform -translate-x-0.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />

            {/* Tick marks */}
            {[25, 50, 75].map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-white/20"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>

          {/* Labels below gauge */}
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Legend */}
        <div className={`flex items-center justify-center text-sm w-full ${isMobile ? 'gap-2' : 'gap-8'}`}>
          <div className={`flex items-center gap-1.5 sm:gap-2 bg-bullish/10 px-2 sm:px-3 py-2 rounded-lg flex-1 min-w-0 max-w-[160px] sm:max-w-none`}>
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-bullish rounded shadow-sm flex-shrink-0" />
            <div className="min-w-0 overflow-hidden">
              <span className="text-bullish font-medium text-[10px] sm:text-sm truncate block">AI Consensus</span>
              <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block truncate">Trust AI recommendations</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 sm:gap-2 bg-bearish/10 px-2 sm:px-3 py-2 rounded-lg flex-1 min-w-0 max-w-[160px] sm:max-w-none`}>
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-bearish rounded shadow-sm flex-shrink-0" />
            <div className="min-w-0 overflow-hidden">
              <span className="text-bearish font-medium text-[10px] sm:text-sm truncate block">Contrarian</span>
              <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block truncate">Bet against AI consensus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sentiment History</h3>
          <InfoTooltip 
            content="Historical view of how the Consensus/Contrarian ratio has evolved over time. This helps identify trends in market sentiment toward AI-driven trading."
            position="left"
          >
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-help">
              <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </InfoTooltip>
        </div>
        
        {/* Chart Container with proper overflow handling for mobile */}
        <div className="w-full overflow-hidden">
          <div className="w-full bg-muted/20 rounded-lg p-1 sm:p-2 overflow-hidden h-48 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={historicalData}
                margin={{
                  top: isMobile ? 5 : 10,
                  right: isMobile ? 5 : 10,
                  left: isMobile ? 0 : 0,
                  bottom: isMobile ? 5 : 0
                }}
                barCategoryGap={isMobile ? "10%" : "15%"}
              >
                <defs>
                  <linearGradient id="cvaultGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="dissentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: isMobile ? 8 : 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return isMobile
                      ? date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  interval={isMobile ? 2 : 'preserveStartEnd'}
                  tickMargin={isMobile ? 4 : 5}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 8 : 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const valInK = value / 1000;
                    return `${valInK.toFixed(0)}K`;
                  }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  width={isMobile ? 30 : 45}
                  tickMargin={isMobile ? 4 : 5}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cvault"
                  name="Consensus TVL"
                  stroke="#22c55e"
                  strokeWidth={isMobile ? 1 : 2}
                  fill="url(#cvaultGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="dissent"
                  name="Contrarian TVL"
                  stroke="#ef4444"
                  strokeWidth={isMobile ? 1 : 2}
                  fill="url(#dissentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center px-2">
          Hover over the chart to see detailed TVL and ratio information
        </p>
      </div>

      {/* Key Insights - Enhanced */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg p-4 border border-border"
      >
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h4 className="font-semibold">Key Insights</h4>
        </div>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Market Preference</div>
            <div className="text-sm font-medium">
              <span className={consensusPercentage >= 50 ? 'text-bullish' : 'text-bearish'}>
                {consensusPercentage >= 70 ? 'Strong AI' : consensusPercentage >= 50 ? 'Moderate AI' : 'Contrarian'}
              </span>
              {' '}dominance
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Sentiment Trend</div>
            <div className="text-sm font-medium text-primary">
              {historicalData.length > 1 && 
                historicalData[historicalData.length - 1].ratio! > historicalData[historicalData.length - 2].ratio!
                ? '↗️ Increasing AI Trust' : '↘️ Decreasing AI Trust'}
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Total Market Size</div>
            <div className="text-sm font-medium">${(totalTVL / 1000).toFixed(0)}K TVL</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">💡 Did you know?</span> The Market Belief Index is a unique indicator 
            that measures real capital allocation between AI-following and AI-betting strategies, providing genuine insight into 
            market sentiment toward AI-driven decision making.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

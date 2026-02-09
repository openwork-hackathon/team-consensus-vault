import EnhancedConsensusView from '@/components/EnhancedConsensusView';

export const metadata = {
  title: 'Enhanced Consensus | Consensus Vault',
  description: 'Combined analysis from AI chatroom and 5-agent trading council',
};

export default function EnhancedConsensusPage() {
  return (
    <div className="min-h-screen bg-background">
      <EnhancedConsensusView />
    </div>
  );
}

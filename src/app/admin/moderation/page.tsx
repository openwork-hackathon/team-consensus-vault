// CVAULT-188: Admin moderation page
import ModerationDashboard from '@/components/admin/ModerationDashboard';

export default function ModerationPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Chat Moderation</h1>
          <p className="text-muted-foreground">
            Review flagged messages, manage muted/banned users, and view moderation logs.
          </p>
        </div>

        <ModerationDashboard />
      </div>
    </main>
  );
}

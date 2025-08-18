import { FipeExplorer } from "@/components/FipeExplorer";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background relative">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute top-4 right-4 z-10">
          <UserMenu />
        </div>
        <div className="container relative py-12">
          <FipeExplorer />
        </div>
      </main>
    </AuthGuard>
  );
};

export default Index;

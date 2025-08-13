import { FipeExplorer } from "@/components/FipeExplorer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background relative">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'var(--gradient-primary)' }} />
      <div className="container relative py-12">
        <FipeExplorer />
      </div>
    </main>
  );
};

export default Index;

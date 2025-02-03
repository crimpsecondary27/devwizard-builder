import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#60A5FA] bg-clip-text text-transparent">
            devwizard
          </div>
          <div className="space-x-4">
            {!session ? (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-[#6366F1] to-[#60A5FA] hover:opacity-90"
              >
                Get Started
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-[#6366F1] to-[#60A5FA] hover:opacity-90"
              >
                Dashboard
              </Button>
            )}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#6366F1] to-[#60A5FA] bg-clip-text text-transparent">
            Build Full-Stack Apps with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Create complete web applications automatically using AI. From frontend to
            backend, watch your ideas come to life in real-time.
          </p>
          {!session ? (
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-gradient-to-r from-[#6366F1] to-[#60A5FA] hover:opacity-90 text-lg"
            >
              Start Building Now
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="bg-gradient-to-r from-[#6366F1] to-[#60A5FA] hover:opacity-90 text-lg"
            >
              Go to Dashboard
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3">AI-Powered Development</h3>
            <p className="text-gray-300">
              Leverage advanced AI to generate complete, production-ready
              applications based on your requirements.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3">Real-Time Generation</h3>
            <p className="text-gray-300">
              Watch your application being built in real-time as you describe your
              needs to our AI.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3">Full-Stack Solution</h3>
            <p className="text-gray-300">
              Get complete applications with both frontend and backend
              functionality, ready for deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            Sign Out
          </Button>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6">
          <p className="text-gray-300">
            Welcome! The AI-powered app builder is coming soon. Stay tuned for
            updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
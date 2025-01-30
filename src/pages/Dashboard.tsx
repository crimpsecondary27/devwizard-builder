import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

type MessageRole = "user" | "assistant";

interface Message {
  role: MessageRole;
  content: string;
}

interface GeneratedCode {
  frontend?: string;
  backend?: string;
  database?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({});
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      setProgress(25);
      
      // Add user message to the chat
      const newMessages: Message[] = [...messages, { role: "user" as const, content: message }];
      setMessages(newMessages);
      setMessage("");

      setProgress(50);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { message },
      });

      if (error) throw error;

      setProgress(75);

      // Store the response before parsing
      const responseContent = data.choices[0].message.content;

      try {
        // Parse the AI response for code sections
        const parsedResponse = JSON.parse(responseContent);
        
        setGeneratedCode({
          frontend: parsedResponse.frontend,
          backend: parsedResponse.backend,
          database: parsedResponse.database,
        });

        // Add AI response to the chat
        setMessages([...newMessages, { 
          role: "assistant" as const, 
          content: "I've generated your application! Check out the code preview sections below." 
        }]);
      } catch (parseError) {
        // Fallback for non-JSON responses
        setMessages([...newMessages, { 
          role: "assistant" as const, 
          content: responseContent 
        }]);
      }

      setProgress(100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to generate application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const CodePreview = ({ code, title }: { code?: string; title: string }) => (
    code ? (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm text-white">{code}</code>
        </pre>
      </div>
    ) : null
  );

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">AI Web Builder</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            Sign Out
          </Button>
        </div>

        {progress > 0 && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 mb-6 h-[60vh] overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white ml-auto'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe the web application you want to build..."
                className="flex-1 bg-gray-800/50 border-gray-600 text-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Generated Application</h2>
            <CodePreview code={generatedCode.frontend} title="Frontend Code" />
            <CodePreview code={generatedCode.backend} title="Backend Code" />
            <CodePreview code={generatedCode.database} title="Database Schema" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
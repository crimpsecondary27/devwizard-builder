import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "@/components/CodeEditor";

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
  const [sandboxUrl, setSandboxUrl] = useState<string>("");

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

  const createSandboxUrl = (code: string) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import React from 'https://esm.sh/react@18.2.0'
            import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
            ${code}
          </script>
        </body>
      </html>
    `;
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      setProgress(25);
      
      const newMessages: Message[] = [...messages, { role: "user" as const, content: message }];
      setMessages(newMessages);
      setMessage("");

      setProgress(50);

      // Store the message in the chat_history table
      const { error: chatError } = await supabase
        .from('chat_history')
        .insert([
          { 
            user_id: session.user.id,
            role: 'user',
            content: message
          }
        ]);

      if (chatError) throw chatError;

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { message },
      });

      if (error) throw error;

      setProgress(75);

      const responseContent = data.choices[0].message.content;

      try {
        const parsedResponse = JSON.parse(responseContent);
        
        // Store the generated app
        const { data: appData, error: appError } = await supabase
          .from('generated_apps')
          .insert([
            {
              user_id: session.user.id,
              name: `App ${new Date().toISOString()}`,
              frontend_code: parsedResponse.frontend,
              backend_code: parsedResponse.backend,
              database_schema: parsedResponse.database
            }
          ])
          .select()
          .single();

        if (appError) throw appError;

        // Store the AI response in chat_history
        const { error: aiChatError } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: session.user.id,
              app_id: appData.id,
              role: 'assistant',
              content: "I've generated your application! Check out the code preview sections below."
            }
          ]);

        if (aiChatError) throw aiChatError;

        setGeneratedCode({
          frontend: parsedResponse.frontend,
          backend: parsedResponse.backend,
          database: parsedResponse.database,
        });

        if (parsedResponse.frontend) {
          console.log('Creating sandbox URL with frontend code:', parsedResponse.frontend);
          const sandboxUrl = createSandboxUrl(parsedResponse.frontend);
          console.log('Generated sandbox URL:', sandboxUrl);
          setSandboxUrl(sandboxUrl);
        }

        setMessages([...newMessages, { 
          role: "assistant" as const, 
          content: "I've generated your application! Check out the code preview sections below." 
        }]);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
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

  const handleCodeChange = (newCode: string | undefined, type: 'frontend' | 'backend' | 'database') => {
    if (newCode) {
      setGeneratedCode(prev => ({
        ...prev,
        [type]: newCode
      }));
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
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="space-y-6">
                {generatedCode.frontend && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Frontend Code</h3>
                    <CodeEditor 
                      code={generatedCode.frontend}
                      language="typescript"
                      onChange={(value) => handleCodeChange(value, 'frontend')}
                    />
                  </div>
                )}
                {generatedCode.backend && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Backend Code</h3>
                    <CodeEditor 
                      code={generatedCode.backend}
                      language="typescript"
                      onChange={(value) => handleCodeChange(value, 'backend')}
                    />
                  </div>
                )}
                {generatedCode.database && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Database Schema</h3>
                    <CodeEditor 
                      code={generatedCode.database}
                      language="sql"
                      onChange={(value) => handleCodeChange(value, 'database')}
                    />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="preview" className="h-[60vh]">
                {sandboxUrl ? (
                  <iframe
                    src={sandboxUrl}
                    className="w-full h-full rounded-lg border border-gray-700"
                    sandbox="allow-scripts allow-same-origin"
                    title="Generated Application Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No preview available yet. Generate some code first!
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

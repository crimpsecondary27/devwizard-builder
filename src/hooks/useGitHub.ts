import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGitHub = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createRepository = async (name: string, isPrivate: boolean = false) => {
    try {
      setIsLoading(true);
      console.log('Creating repository:', { name, isPrivate });

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('github-operations', {
        body: { 
          action: 'create-repository',
          name,
          isPrivate
        }
      });

      if (error) {
        console.error('Error creating repository:', error);
        throw error;
      }

      console.log('Repository created successfully:', data);

      toast({
        title: "Success",
        description: `Repository ${name} created successfully!`
      });

      return data;
    } catch (error) {
      console.error('Error creating repository:', error);
      toast({
        title: "Error",
        description: "Failed to create repository. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createRepository,
    isLoading
  };
};
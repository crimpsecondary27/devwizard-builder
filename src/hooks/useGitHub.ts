import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGitHub = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createRepository = async (name: string, isPrivate: boolean = false) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('github-operations', {
        body: { 
          action: 'create-repository',
          name,
          isPrivate
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Repository ${name} created successfully!`,
        variant: "default"
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
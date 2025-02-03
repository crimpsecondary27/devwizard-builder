import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGitHub() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createRepository = async (name: string, isPrivate: boolean = true) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-operations', {
        body: { operation: 'create-repo', name, isPrivate }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Repository created successfully',
      });

      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create repository',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createRepository,
  };
}
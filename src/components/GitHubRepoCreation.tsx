import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGitHub } from '@/hooks/useGitHub';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function GitHubRepoCreation() {
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const { createRepository, isLoading } = useGitHub();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName) return;
    
    try {
      await createRepository(repoName, isPrivate);
      setRepoName('');
    } catch (error) {
      console.error('Failed to create repository:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repo-name">Repository Name</Label>
        <Input
          id="repo-name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="Enter repository name"
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="private"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
        <Label htmlFor="private">Private Repository</Label>
      </div>

      <Button type="submit" disabled={isLoading || !repoName}>
        {isLoading ? 'Creating...' : 'Create Repository'}
      </Button>
    </form>
  );
}
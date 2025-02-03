import { supabase } from "@/integrations/supabase/client";

export async function getGitHubToken() {
  const { data: { GITHUB_ACCESS_TOKEN } } = await supabase.functions.invoke('get-secret', {
    body: { key: 'GITHUB_ACCESS_TOKEN' }
  });
  return GITHUB_ACCESS_TOKEN;
}

export async function createRepository(name: string, isPrivate: boolean = true) {
  const token = await getGitHubToken();
  
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create repository');
  }

  return response.json();
}

export async function pushToRepository(repoName: string, files: { path: string; content: string }[]) {
  const token = await getGitHubToken();
  
  // Get the default branch
  const repoResponse = await fetch(`https://api.github.com/repos/${repoName}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  
  if (!repoResponse.ok) {
    throw new Error('Failed to get repository information');
  }
  
  const repoData = await repoResponse.json();
  const branch = repoData.default_branch;

  // Get the latest commit SHA
  const refResponse = await fetch(
    `https://api.github.com/repos/${repoName}/git/refs/heads/${branch}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error('Failed to get reference');
  }

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // Create a new tree
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${repoName}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        throw new Error('Failed to create blob');
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      };
    })
  );

  const treeResponse = await fetch(
    `https://api.github.com/repos/${repoName}/git/trees`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree,
      }),
    }
  );

  if (!treeResponse.ok) {
    throw new Error('Failed to create tree');
  }

  const treeData = await treeResponse.json();

  // Create a commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${repoName}/git/commits`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Initial commit',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    }
  );

  if (!commitResponse.ok) {
    throw new Error('Failed to create commit');
  }

  const commitData = await commitResponse.json();

  // Update the reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${repoName}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error('Failed to update reference');
  }

  return updateRefResponse.json();
}
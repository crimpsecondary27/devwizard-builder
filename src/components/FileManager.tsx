import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface FileType {
  id: string;
  name: string;
  content: string | null;
  folder_id: string | null;
}

interface FolderType {
  id: string;
  name: string;
  parent_id: string | null;
}

interface FileTreeItemProps {
  name: string;
  isFolder?: boolean;
  isOpen?: boolean;
  level: number;
  onToggle?: () => void;
  isSelected?: boolean;
  onClick: () => void;
}

const FileTreeItem = ({ name, isFolder = false, isOpen = false, level, onToggle, isSelected, onClick }: FileTreeItemProps) => {
  return (
    <div
      className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700/50 ${
        isSelected ? 'bg-gray-700/50' : ''
      }`}
      style={{ paddingLeft: `${level * 16}px` }}
      onClick={onClick}
    >
      {isFolder && (
        <button onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className="mr-1">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
      {isFolder ? <Folder className="h-4 w-4 mr-2" /> : <File className="h-4 w-4 mr-2" />}
      <span className="text-sm truncate">{name}</span>
    </div>
  );
};

export function FileManager() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    fetchFilesAndFolders();
  }, []);

  const fetchFilesAndFolders = async () => {
    const { data: foldersData } = await supabase
      .from('folders')
      .select('*')
      .order('name');
    
    const { data: filesData } = await supabase
      .from('files')
      .select('*')
      .order('name');

    if (foldersData) setFolders(foldersData);
    if (filesData) setFiles(filesData);
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFileTree = (parentId: string | null = null, level: number = 0) => {
    const foldersAtLevel = folders.filter(f => f.parent_id === parentId);
    const filesAtLevel = files.filter(f => f.folder_id === parentId);

    return (
      <>
        {foldersAtLevel.map(folder => (
          <div key={folder.id}>
            <FileTreeItem
              name={folder.name}
              isFolder
              isOpen={openFolders.has(folder.id)}
              level={level}
              onToggle={() => toggleFolder(folder.id)}
              isSelected={selectedItem === folder.id}
              onClick={() => setSelectedItem(folder.id)}
            />
            {openFolders.has(folder.id) && renderFileTree(folder.id, level + 1)}
          </div>
        ))}
        {filesAtLevel.map(file => (
          <FileTreeItem
            key={file.id}
            name={file.name}
            level={level}
            isSelected={selectedItem === file.id}
            onClick={() => setSelectedItem(file.id)}
          />
        ))}
      </>
    );
  };

  return (
    <div className="h-full bg-gray-800/50 text-white overflow-y-auto">
      <div className="p-2">
        <h2 className="text-sm font-semibold mb-2">Files</h2>
        {renderFileTree()}
      </div>
    </div>
  );
}
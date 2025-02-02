import { useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export function Terminal() {
  const [commands, setCommands] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      setCommands([...commands, `$ ${currentCommand}`, 'Command executed...']);
      setCurrentCommand('');
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white font-mono text-sm">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50">
        <TerminalIcon className="h-4 w-4" />
        <span>Terminal</span>
      </div>
      <div className="p-4 h-[calc(100%-40px)] overflow-y-auto">
        {commands.map((cmd, i) => (
          <div key={i} className="mb-1">{cmd}</div>
        ))}
        <div className="flex items-center">
          <span className="mr-2">$</span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleCommand}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
          />
        </div>
      </div>
    </div>
  );
}
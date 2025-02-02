import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export function Terminal() {
  const [commands, setCommands] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when commands update
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const executeCommand = (command: string) => {
    console.log('Executing command:', command);
    let output = '';

    // Basic command handling
    switch (command.toLowerCase()) {
      case 'clear':
        setCommands([]);
        return;
      case 'help':
        output = 'Available commands: clear, help, echo, pwd, ls';
        break;
      case 'pwd':
        output = '/home/user';
        break;
      case 'ls':
        output = 'Documents  Downloads  Pictures  Public';
        break;
      default:
        if (command.startsWith('echo ')) {
          output = command.slice(5); // Remove 'echo ' from the start
        } else {
          output = `Command not found: ${command}`;
        }
    }

    setCommands(prev => [...prev, `$ ${command}`, output]);
    setCommandHistory(prev => [...prev, command]);
  };

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      executeCommand(currentCommand.trim());
      setCurrentCommand('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className="h-full bg-gray-900 text-white font-mono text-sm flex flex-col"
      onClick={focusInput}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50">
        <TerminalIcon className="h-4 w-4" />
        <span>Terminal</span>
      </div>
      <div 
        ref={terminalRef}
        className="p-4 flex-1 overflow-y-auto"
      >
        {commands.map((cmd, i) => (
          <div key={i} className="mb-1 whitespace-pre-wrap">{cmd}</div>
        ))}
        <div className="flex items-center">
          <span className="mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleCommand}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
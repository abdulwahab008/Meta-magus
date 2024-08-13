import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import './Terminal.css';

const Terminal = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [currentPath, setCurrentPath] = useState('C:\\Users\\User\\Documents');
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand();
    }
  };

  const handleCommand = async () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      setOutput(prev => [{ type: 'command', content: trimmedInput, path: currentPath }, ...prev]);
      await executeCommand(trimmedInput);
      setInput('');
    }
  };

  const executeCommand = async (command) => {
    const [cmd, ...args] = command.split(' ');
    switch (cmd.toLowerCase()) {
      case 'cd':
        handleCdCommand(args);
        break;
      case 'mkdir':
        handleMkdirCommand(args);
        break;
      default:
        try {
          const response = await fetch('/api/terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, currentPath })
          });
          const result = await response.json();
          if (result.error) {
            addOutput(result.error, 'error');
          } else {
            addOutput(result.output);
          }
        } catch (error) {
          addOutput('Failed to execute command', 'error');
        }
    }
  };

  const handleCdCommand = (args) => {
    if (args.length > 0) {
      if (args[0] === '..') {
        const newPath = currentPath.split('\\').slice(0, -1).join('\\');
        setCurrentPath(newPath || 'C:\\');
      } else {
        setCurrentPath(prev => `${prev}\\${args.join(' ')}`);
      }
      addOutput(`Changed directory to: ${currentPath}`);
    } else {
      addOutput('Usage: cd <directory>');
    }
  };

  const handleMkdirCommand = (args) => {
    if (args.length > 0) {
      addOutput(`Directory created: ${args[0]}`);
    } else {
      addOutput('Usage: mkdir <directory_name>');
    }
  };

  const addOutput = (content, type = 'result') => {
    setOutput(prev => [{ type, content }, ...prev]);
  };

  const handleResize = (e) => {
    const startY = e.clientY;
    const startHeight = terminalRef.current.offsetHeight;

    const doDrag = (e) => {
      terminalRef.current.style.height = `${startHeight - e.clientY + startY}px`;
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <div className="terminal-wrapper" ref={terminalRef}>
      <div className="terminal-resize-handle" onMouseDown={handleResize}></div>
      <div className="terminal-header">
        <div className="terminal-tabs">
          <div className="terminal-tab active">TERMINAL</div>
        </div>
        <div className="terminal-controls">
          <button className="terminal-control-button"><FontAwesomeIcon icon={faPlus} /></button>
          <button className="terminal-control-button"><FontAwesomeIcon icon={faMinus} /></button>
          <button className="terminal-control-button" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
        </div>
      </div>
      <div className="terminal-input-container">
        <span className="terminal-path">PS {currentPath}&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="terminal-input"
        />
      </div>
      <div className="terminal-content">
        {output.map((item, index) => (
          <div key={index} className="terminal-output-line">
            {item.type === 'command' && (
              <div className="terminal-output-command">
                PS {item.path}&gt;{item.content}
              </div>
            )}
            {item.type === 'result' && <div className="terminal-output-result">{item.content}</div>}
            {item.type === 'error' && <div className="terminal-output-error">{item.content}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
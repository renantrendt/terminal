import { useState, useEffect, useRef } from 'react'
import './App.css'
import { projects } from './data/projects'
import { skills } from './data/skills'

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState([
    { text: 'Welcome to Terminal Portfolio!', type: 'system' },
    { text: 'Type "help" to see available commands.', type: 'system' }
  ])
  const inputRef = useRef(null)
  const terminalRef = useRef(null)

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current.focus()
    
    // Keep terminal scrolled to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])
  
  // Function to focus on the input field
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Add user input to output
    const newOutput = [...output, { text: `$ ${input}`, type: 'command' }]
    
    // Process command
    const command = input.trim().toLowerCase()
    const args = command.split(' ')
    
    if (command === 'help') {
      newOutput.push({ text: 'Available commands:', type: 'system' })
      newOutput.push({ text: '  help - show this super useful message🫠', type: 'system' })
      newOutput.push({ text: '  ls -la - List all projects', type: 'system' })
      newOutput.push({ text: '  skills - Show my skill levels', type: 'system' })
      newOutput.push({ text: '  [project name] - Open the project URL', type: 'system' })
      newOutput.push({ text: '  type "tips" to get tips for the games', type: 'system' })
    } else if (command === 'ls -la') {
      newOutput.push({ text: 'Projects:', type: 'system' })
      projects.forEach(project => {
        // Create a special object for project listings with clickable names
        newOutput.push({ 
          projectName: project.name,
          projectUrl: project.url,
          description: project.description,
          type: 'project-listing'
        })
      })
    } else if (command === 'clear') {
      setInput('')
      setOutput([])
      return
    } else if (command === 'skills') {
      newOutput.push({ text: 'Skills:', type: 'system' })
      skills.forEach(skill => {
        // Create a progress bar using characters
        const barLength = 40;
        const filledLength = Math.round((skill.percentage / 100) * barLength);
        const emptyLength = barLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        
        newOutput.push({ 
          text: `  ${skill.name.padEnd(25)} ${progressBar} ${skill.percentage}%`, 
          type: 'system' 
        });
      });
    } else if (command === 'contact') {
      newOutput.push({ text: 'Contact Information:', type: 'system' })
      newOutput.push({ text: '  r + € n å n † r € n d † (2+option) (google - oogle) ∑ å ! l . com', type: 'system' })
    } else if (command === 'tips') {
      newOutput.push({ text: 'Game Tips and Secrets:', type: 'system' })
      newOutput.push({ text: '  Type unlock___() in the console of the snake game to get something new', type: 'system' })
      newOutput.push({ text: '  Type unlock___() in the console of the snake game to unlock something also else', type: 'system' })
      newOutput.push({ text: '  Type set____() to get some cash cash', type: 'system' })
      newOutput.push({ text: '  Type lootBox_________(\'Item Name\', \'rarity\', quantity); to unlock any items in ancient loot box game', type: 'system' })
    } else {
      // Check if command matches a project name
      const project = projects.find(p => p.name.toLowerCase() === command)
      if (project) {
        newOutput.push({ text: `Opening ${project.name}...`, type: 'system' })
        window.open(project.url, '_blank')
      } else {
        newOutput.push({ 
          text: `Command not found: ${command}. Type "help" for available commands.`, 
          type: 'error' 
        })
      }
    }
    
    setOutput(newOutput)
    setInput('')
  }

  return (
    <div className="terminal" ref={terminalRef} onClick={focusInput}>
      <div className="terminal-header">
        <div className="terminal-buttons">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="terminal-title">terminal-folio</div>
      </div>
      <div className="terminal-content">
        {output.map((line, index) => {
          // Special rendering for project listings with clickable names
          if (line.type === 'project-listing') {
            return (
              <div key={index} className="terminal-line system">
                {'  '}
                <span 
                  className="project-link" 
                  onClick={() => window.open(line.projectUrl, '_blank')}
                >
                  {line.projectName}
                </span>
                {' - ' + line.description}
              </div>
            );
          }
          // Regular line rendering
          return (
            <div key={index} className={`terminal-line ${line.type}`}>
              {line.text}
            </div>
          );
        })}
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="terminal-prompt">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className="terminal-input"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}

export default App

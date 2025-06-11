import { useState, useEffect, useRef } from 'react'
import './App.css'
import { projects } from './data/projects'
import { skills } from './data/skills'

function App() {
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [output, setOutput] = useState([])
  const [lastLogin, setLastLogin] = useState(null)
  const [showSandwich, setShowSandwich] = useState(false)
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)
  const [showExitText, setShowExitText] = useState(true)
  const inputRef = useRef(null)
  const terminalRef = useRef(null)
  const audioRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // localStorage utility functions
  const saveUserData = (user, loginTime) => {
    localStorage.setItem('terminal_username', user)
    localStorage.setItem('terminal_last_login', loginTime.toISOString())
  }

  const loadUserData = () => {
    const savedUsername = localStorage.getItem('terminal_username')
    const savedLastLogin = localStorage.getItem('terminal_last_login')
    const savedHistory = localStorage.getItem('terminal_command_history')
    return {
      username: savedUsername,
      lastLogin: savedLastLogin ? new Date(savedLastLogin) : null,
      commandHistory: savedHistory ? JSON.parse(savedHistory) : []
    }
  }

  const clearUserData = () => {
    localStorage.removeItem('terminal_username')
    localStorage.removeItem('terminal_last_login')
    localStorage.removeItem('terminal_command_history')
  }

  const saveCommandHistory = (history) => {
    localStorage.setItem('terminal_command_history', JSON.stringify(history))
  }

  useEffect(() => {
    console.log('🚀 Component mounted')
    // Check for existing user on mount
    const userData = loadUserData()
    if (userData.username) {
      setUsername(userData.username)
      setIsLoggedIn(true)
      setLastLogin(userData.lastLogin)
      setCommandHistory(userData.commandHistory)
      setOutput([
        { text: 'Welcome to Terminal Portfolio!', type: 'system' },
        { text: 'Type "help" to see available commands.', type: 'system' }
      ])
    } else {
      setOutput([
        { text: 'Welcome to Terminal Portfolio!', type: 'system' },
        { text: 'Please login to continue.', type: 'system' },
        { text: 'Usage: login [username]', type: 'system' }
      ])
    }

    // Focus input when component mounts
    inputRef.current.focus()
    console.log('🎯 Input focused on mount')
  }, [])

  useEffect(() => {
    // Keep terminal scrolled to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    // Cleanup typing sound and timeout on unmount
    return () => {
      stopTypingSound()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Global ESC key listener for Matrix
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showMatrix) {
        console.log('Global ESC - closing Matrix')
        setShowMatrix(false)
        setShowExitText(true) // Reset exit text for next time
      }
    }

    if (showMatrix) {
      document.addEventListener('keydown', handleEscKey)
      
      // Hide "Press ESC to exit" text after 6 seconds
      const exitTextTimer = setTimeout(() => {
        setShowExitText(false)
      }, 6000)
      
      return () => {
        document.removeEventListener('keydown', handleEscKey)
        clearTimeout(exitTextTimer)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showMatrix])
  
  // Function to focus on the input field
  const focusInput = () => {
    console.log('🎯 focusInput called')
    if (inputRef.current) {
      inputRef.current.focus()
    }
    // Initialize audio on first interaction
    initializeAudio()
  }

  // Function to format the last login time
  const formatLastLogin = (date) => {
    if (!date) return null
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const dayName = days[date.getDay()]
    const monthName = months[date.getMonth()]
    const day = date.getDate().toString().padStart(2, ' ')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${dayName} ${monthName} ${day} ${hours}:${minutes}:${seconds}`
  }

  // Initialize audio on first user interaction (following Chrome's autoplay policy)
  const initializeAudio = () => {
    console.log('🎵 initializeAudio called')
    console.log('🎵 audioRef.current:', !!audioRef.current)
    console.log('🎵 audioEnabled:', audioEnabled)
    
    if (audioRef.current && !audioEnabled) {
      console.log('🎵 Starting audio initialization with user gesture...')
      
      // Set volume first
      audioRef.current.volume = 0.3
      
      // Try to play briefly to unlock audio context (Chrome autoplay policy requirement)
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Audio unlocked with user gesture!')
          // Immediately pause and reset for future use
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setAudioEnabled(true)
        }).catch(e => {
          console.log('❌ Audio unlock failed:', e)
          console.log('This is likely due to insufficient user gesture')
        })
      }
    } else if (audioEnabled) {
      console.log('🎵 Audio already enabled')
    } else {
      console.log('❌ No audio ref available')
    }
  }

  // Typing sound functions
  const startTypingSound = () => {
    console.log('🔊 startTypingSound called')
    console.log('🔊 audioRef.current:', !!audioRef.current)
    console.log('🔊 audioEnabled:', audioEnabled)
    console.log('🔊 audio paused:', audioRef.current ? audioRef.current.paused : 'no audio')
    
    if (audioRef.current && audioEnabled && audioRef.current.paused) {
      console.log('🔊 All conditions met - starting sound...')
      audioRef.current.currentTime = 0
      audioRef.current.loop = true
      audioRef.current.volume = 0.3 // Lower volume
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Typing sound playing successfully!')
          })
          .catch(e => {
            console.log('❌ Audio play failed:', e)
          })
      }
    } else if (!audioEnabled) {
      console.log('🎵 Audio not enabled yet - trying to initialize')
      initializeAudio()
    } else {
      console.log('❌ Conditions not met for starting sound')
    }
  }

  const stopTypingSound = () => {
    if (audioRef.current && !audioRef.current.paused) {
      console.log('⏹️ Stopping typing sound')
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const handleInputChange = (e) => {
    console.log('⌨️ handleInputChange called with:', e.target.value)
    setInput(e.target.value)
    // Reset history index when user starts typing
    setHistoryIndex(-1)
    
    // Typing is a user gesture - try to enable audio if not already enabled
    if (!audioEnabled && audioRef.current) {
      console.log('⌨️ Typing detected - attempting to unlock audio')
      initializeAudio()
    }
    
    // Handle typing sounds
    console.log('⌨️ Checking conditions for typing sound...')
    console.log('⌨️ audioRef.current:', !!audioRef.current)
    console.log('⌨️ audioEnabled:', audioEnabled)
    console.log('⌨️ audio paused:', audioRef.current ? audioRef.current.paused : 'no audio')
    
    if (audioRef.current && audioEnabled && audioRef.current.paused) {
      console.log('⌨️ Conditions met - calling startTypingSound')
      startTypingSound()
    } else if (!audioEnabled) {
      console.log('⌨️ Audio not enabled yet - will try on next keystroke')
    } else {
      console.log('⌨️ Conditions not met for typing sound')
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop sound when user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout reached - stopping sound')
      stopTypingSound()
    }, 500) // Stop sound 500ms after last keystroke (longer delay)
  }

  const handleKeyDown = (e) => {
    // Handle ESC key to close Matrix
    if (e.key === 'Escape' && showMatrix) {
      console.log('ESC pressed - closing Matrix')
      setShowMatrix(false)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Stop typing sound for navigation
      stopTypingSound()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Stop typing sound for navigation
      stopTypingSound()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'Enter') {
      // Enter is handled by form submit, just stop typing sound
      stopTypingSound()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Stop typing sound when command is submitted
    stopTypingSound()
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    const promptSymbol = isLoggedIn ? `[${username}] ~ %` : '$'
    // Add user input to output
    const newOutput = [...output, { text: `${promptSymbol} ${input}`, type: 'command' }]
    
    // Add command to history (if not empty and not just spaces)
    if (input.trim()) {
      const newHistory = [...commandHistory, input.trim()]
      setCommandHistory(newHistory)
      saveCommandHistory(newHistory)
    }
    // Reset history index
    setHistoryIndex(-1)
    
    // Process command
    const command = input.trim().toLowerCase()
    const args = input.trim().split(' ')
    
    // Handle login command when not logged in
    if (!isLoggedIn) {
      if (args[0].toLowerCase() === 'login') {
        if (args.length < 2 || !args[1]) {
          newOutput.push({ text: 'Can you not read the "help"?? Go to school lil buddy', type: 'error' })
        } else if (args[1].length > 10) {
          newOutput.push({ text: 'Username must be 10 characters or less', type: 'error' })
        } else {
          const newUsername = args[1]
          const loginTime = new Date()
          setUsername(newUsername)
          setIsLoggedIn(true)
          setLastLogin(loginTime)
          saveUserData(newUsername, loginTime)
          newOutput.push({ text: `Welcome, ${newUsername}!`, type: 'system' })
          newOutput.push({ text: 'Type "help" to see available commands.', type: 'system' })
        }
      } else {
        newOutput.push({ text: 'Please login first. Usage: login [username]', type: 'error' })
      }
    } else {
      // Update last login time when user submits input (if logged in)
      const currentTime = new Date()
      setLastLogin(currentTime)
      saveUserData(username, currentTime)
      
      // Handle regular commands when logged in
      if (command === 'cd matrix && npm run dev') {
        newOutput.push({ text: 'Initializing Matrix...', type: 'system' })
        newOutput.push({ text: 'Welcome to the Matrix', type: 'system' })
        setShowMatrix(true)
        setShowExitText(true) // Reset exit text when Matrix starts
      } else if (command === 'sudo make me a sandwich' || input.trim().toLowerCase() === 'sudo make me a sandwich') {
        newOutput.push({ text: 'Okay.', type: 'system' })
        setShowSandwich(true)
        // Hide sandwich after 4 seconds
        setTimeout(() => {
          setShowSandwich(false)
        }, 4000)
      } else if (command === 'help') {
        newOutput.push({ text: 'Available commands:', type: 'system' })
        newOutput.push({ text: '  help - show this super useful message🫠', type: 'system' })
        newOutput.push({ text: '  ls -la - List all projects', type: 'system' })
        newOutput.push({ text: '  skills - Show my skill levels (100% true. Trust💀)', type: 'system' })
        newOutput.push({ text: '  [project name] - Open the project URL', type: 'system' })
        newOutput.push({ text: '  type "tips" to get tips for the games', type: 'system' })
        newOutput.push({ text: '  login [username] - Login with a username', type: 'system' })
        newOutput.push({ text: '  logout - Logout and clear user data', type: 'system' })
      } else if (command === 'logout') {
        clearUserData()
        setUsername('')
        setIsLoggedIn(false)
        setLastLogin(null)
        setCommandHistory([])
        setHistoryIndex(-1)
        newOutput.push({ text: 'Logged out successfully.', type: 'system' })
        newOutput.push({ text: 'Please login to continue.', type: 'system' })
        newOutput.push({ text: 'Usage: login [username]', type: 'system' })
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
        newOutput.push({ text: '  r + € n å n † r € n d † (2 + shift) (Google - oogle) ∑ å ! l . com', type: 'system' })
      } else if (command === 'tips') {
        newOutput.push({ text: 'Game Tips and Secrets:', type: 'system' })
        newOutput.push({ text: '  unlockForTest() - in the console of the snake game to get something new', type: 'system' })
        newOutput.push({ text: '  unlockHacker() - in the console of the snake game to unlock something else new', type: 'system' })
        newOutput.push({ text: '  setmoney(amount) - to get some $$$ in the Doge clicker console', type: 'system' })
        newOutput.push({ text: '  earn.some rainbow culture() - and get a really cool rainbow skin in snake game', type: 'system' })
        newOutput.push({ text: '  lootBoxConsole.addItem("name", "rarity ", #);- to unlock any items in ancient loot box game', type: 'system' })
      } else {
        // Check if command matches a project name
        const project = projects.find(p => p.name.toLowerCase() === command)
        if (project) {
          newOutput.push({ text: `Opening ${project.name}...`, type: 'system' })
          window.open(project.url, '_blank')
        } else {
          newOutput.push({ 
            text: `Command not found: ${input.trim()}. Type "help" for available commands.`, 
            type: 'error' 
          })
        }
      }
    }
    
    setOutput(newOutput)
    setInput('')
  }

  return (
    <div className="terminal" ref={terminalRef} onClick={(e) => {
      console.log('🖱️ Terminal clicked - this is a USER GESTURE')
      // Ensure audio is initialized with this user gesture
      if (!audioEnabled) {
        console.log('🎵 Attempting to unlock audio with click gesture')
        initializeAudio()
      }
      focusInput()
    }}>
      <div className="terminal-header">
        <div className="terminal-buttons">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="terminal-title">terminal-folio</div>
        {lastLogin && isLoggedIn && (
          <div className="last-login">
            Last login: {formatLastLogin(lastLogin)}
          </div>
        )}
        <div className="audio-status" onClick={() => {
          console.log('🔊 Audio status clicked')
          if (!audioEnabled) {
            initializeAudio()
          }
        }}>
          {audioEnabled ? '🔊' : '🔇'} {audioEnabled ? 'Sound ON' : 'Click to enable sound'}
        </div>
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
          <span className="terminal-prompt">
            {isLoggedIn ? `[${username}] ~ %` : '$'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              console.log('🎯 Input focused - calling initializeAudio')
              initializeAudio()
            }}
            onBlur={() => {
              stopTypingSound()
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
              }
            }}
            className="terminal-input"
            autoFocus
          />
        </form>
      </div>
      {showSandwich && (
        <div className="sandwich-overlay">
          <div className="sandwich-comic">
            <img src="sandwich.png" alt="sudo sandwich comic" className="sandwich-image" />
          </div>
        </div>
      )}
      {showMatrix && (
        <div className="matrix-overlay">
          <div className="matrix-container">
            {Array.from({ length: 80 }, (_, i) => (
              <div key={i} className="matrix-column" style={{ left: `${i * 1.5}%` }}>
                {Array.from({ length: 50 }, (_, j) => (
                  <span key={j} className="matrix-char" style={{ 
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${0.8 + Math.random() * 1.5}s`
                  }}>
                    {'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01010101'[Math.floor(Math.random() * 80)]}
                  </span>
                ))}
              </div>
            ))}
            <div className="matrix-text">
              <div className="falling-text">
                {"Welcome to the Matrix".split('').map((char, index) => (
                  <span 
                    key={index} 
                    className="falling-letter"
                    style={{ 
                      animationDelay: `${index * 1}s`,
                      left: `${index * 20}px`
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
              {showExitText && <div className="exit-text">Press ESC to exit</div>}
            </div>
          </div>
        </div>
      )}
      <audio 
        ref={audioRef} 
        preload="auto" 
        muted={false}
        onLoadedData={() => console.log('🎵 Audio loaded successfully')}
        onCanPlay={() => console.log('🎵 Audio can play')}
        onError={(e) => console.log('❌ Audio loading error:', e)}
        onPlay={() => console.log('▶️ Audio started playing')}
        onPause={() => console.log('⏸️ Audio paused')}
      >
        <source src="typing.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

export default App

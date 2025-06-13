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
  const [phillQuotes, setPhillQuotes] = useState([])
  const [lastPhillQuote, setLastPhillQuote] = useState(null)
  
  // Spaceship game states
  const [gameActive, setGameActive] = useState(false)
  const [showGameInstructions, setShowGameInstructions] = useState(false)
  const [spaceshipPosition, setSpaceshipPosition] = useState({ x: 50, y: 90 }) // percentage based
  const [lives, setLives] = useState(3)
  const [debris, setDebris] = useState([])
  const [gameStartTime, setGameStartTime] = useState(null)
  const [showExplosion, setShowExplosion] = useState(false)
  const [showVictoryMessage, setShowVictoryMessage] = useState(false)
  
  // Achievement system
  const [achievements, setAchievements] = useState({
    matrixEscape: false,    // Complete the spaceship game
    sandwichMaster: false,  // Use sudo make me a sandwich
    philosophySeeker: false // Use phill command
  })
  const [showAchievement, setShowAchievement] = useState(null)
  
  const inputRef = useRef(null)
  const terminalRef = useRef(null)
  const audioRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Array of Phill quotes
  const allPhillQuotes = [
    '"Bean or not to Bean?" – William Milkshake',
    '"I play, therefore i\'m gamer" – René Des Cart',
    '"In the middle of a ranked, you can\'t pause the game" – Alberto felipe',
    '"That match does not makes you lose, gives you trophies" – Frederico Nice\'she',
    '"I have a dog." – Martin Leather Queen RJ',
    '"Power... Is power :O" – Francis Bacon',
    '"The journey of a thousand steps begins with a mile" – Lime TCG',
    '"Time is honey" – Benjaminas Francisco',
    '"You get 100% of the shots you don\'t take, correctly." – Wine Great\'zky',
    '"Success is not fatal, failure is not final: It is ChatGPT, that counts." – Win is a ton Church chill',
    '"Heaven is other people." – Jeens-Peel Sorte',
    '"All those who don\'t wander are found." – JJk Toltec'
  ]

  // Function to get a random Phill quote without repeating
  const getRandomPhillQuote = () => {
    let availableQuotes = [...phillQuotes]
    
    // If no quotes available or cycle is complete, reset with all quotes
    if (availableQuotes.length === 0) {
      availableQuotes = [...allPhillQuotes]
    }
    
    // If there's a last quote and multiple options, remove it to avoid repetition
    if (lastPhillQuote && availableQuotes.length > 1) {
      availableQuotes = availableQuotes.filter(quote => quote !== lastPhillQuote)
    }
    
    // Get random quote from available options
    const randomIndex = Math.floor(Math.random() * availableQuotes.length)
    const selectedQuote = availableQuotes[randomIndex]
    
    // Update state: remove selected quote from cycle and set as last quote
    const remainingQuotes = phillQuotes.filter(quote => quote !== selectedQuote)
    setPhillQuotes(remainingQuotes)
    setLastPhillQuote(selectedQuote)
    
    return selectedQuote
  }

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
    localStorage.removeItem('terminal_achievements')
  }

  const saveCommandHistory = (history) => {
    localStorage.setItem('terminal_command_history', JSON.stringify(history))
  }

  // Achievement utility functions
  const saveAchievements = (achievementData) => {
    localStorage.setItem('terminal_achievements', JSON.stringify(achievementData))
  }

  const loadAchievements = () => {
    const saved = localStorage.getItem('terminal_achievements')
    return saved ? JSON.parse(saved) : {
      matrixEscape: false,
      sandwichMaster: false,
      philosophySeeker: false
    }
  }

  const unlockAchievement = (achievementKey, title, description) => {
    if (!achievements[achievementKey]) {
      const newAchievements = { ...achievements, [achievementKey]: true }
      setAchievements(newAchievements)
      saveAchievements(newAchievements)
      
      // Show achievement notification
      setShowAchievement({ title, description })
      setTimeout(() => setShowAchievement(null), 2500)
    }
  }

  useEffect(() => {
    console.log('🚀 Component mounted')
    // Initialize Phill quotes
    setPhillQuotes([...allPhillQuotes])
    
    // Load achievements
    const savedAchievements = loadAchievements()
    setAchievements(savedAchievements)
    
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
    // Matrix key handlers for game controls and exit
    const handleMatrixKeys = (e) => {
      if (showMatrix) {
        console.log(`Matrix key pressed: ${e.key}`)
        
        if (e.key === 'Escape') {
          console.log('ESC - closing Matrix')
          setShowMatrix(false)
          setShowExitText(true) // Reset exit text for next time
          // Reset game state
          setGameActive(false)
          setShowGameInstructions(false)
          setSpaceshipPosition({ x: 50, y: 90 })
          setLives(3)
          setDebris([])
          setGameStartTime(null)
          setShowExplosion(false)
          setShowVictoryMessage(false)
          return
        }
        
        // Spaceship game controls
        if (gameActive) {
          if (['a', 'A', 'ArrowLeft'].includes(e.key)) {
            e.preventDefault()
            setSpaceshipPosition(prev => ({ 
              ...prev, 
              x: Math.max(5, prev.x - 3) // Move left, min 5%
            }))
          } else if (['d', 'D', 'ArrowRight'].includes(e.key)) {
            e.preventDefault()
            setSpaceshipPosition(prev => ({ 
              ...prev, 
              x: Math.min(95, prev.x + 3) // Move right, max 95%
            }))
          }
        }
        
        // Prevent any other keys from doing terminal stuff while in matrix
        e.preventDefault()
      }
    }

    if (showMatrix) {
      document.addEventListener('keydown', handleMatrixKeys)
      
      // Hide "Press ESC to exit" text after 6 seconds
      const exitTextTimer = setTimeout(() => {
        setShowExitText(false)
      }, 6000)
      
      // Show game instructions after ALL letters finish falling
      // "Welcome to the Matrix" = 18 chars, last letter starts at 17s, takes 3s to fall = 20s total
      const instructionsTimer = setTimeout(() => {
        setShowGameInstructions(true)
      }, 20000)
      
      // Start the actual game after instructions are shown (23 seconds total)
      const gameStartTimer = setTimeout(() => {
        setGameActive(true)
        setGameStartTime(Date.now())
        
        // Force immediate debris spawn when game starts
        setTimeout(() => {
          console.log('🟡 FORCE SPAWNING INITIAL DEBRIS')
          setDebris(prevDebris => {
            const initialDebris = []
            for (let i = 0; i < 25; i++) { // Spawn 25 debris immediately (was 18)
              initialDebris.push({
                id: `initial_debris_${Date.now()}_${i}`,
                x: Math.random() * 70 + 15,
                y: Math.random() * 10 - 15, // Start at TOP only (-15 to -5)
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 4,
                pattern: Math.random() > 0.5 ? 'striped' : 'checkered'
              })
            }
            console.log('🟡 Force spawned debris:', initialDebris)
            return initialDebris
          })
        }, 500) // 500ms after game starts
      }, 23000)
      
      return () => {
        document.removeEventListener('keydown', handleMatrixKeys)
        clearTimeout(exitTextTimer)
        clearTimeout(instructionsTimer)
        clearTimeout(gameStartTimer)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleMatrixKeys)
    }
  }, [showMatrix, gameActive])
  
  // Spaceship automatic movement (upward)
  useEffect(() => {
    if (gameActive && gameStartTime && !showVictoryMessage) {
      const moveInterval = setInterval(() => {
        setSpaceshipPosition(prev => {
          const newY = prev.y - 0.4 // Move up faster (~20 seconds to reach top)
          
          // Check if reached portal (much smaller hitbox - within 3% of portal center)
          const portalY = 5 // Portal is at 5% from top
          const portalX = 50 // Portal is at 50% from left
          const distanceToPortal = Math.sqrt(
            Math.pow(prev.x - portalX, 2) + Math.pow(newY - portalY, 2)
          )
          
          if (distanceToPortal < 5) { // Much smaller hitbox
            // Victory! Show escape message then exit matrix
            setShowVictoryMessage(true)
            setGameActive(false) // Stop the game immediately
            
            // Unlock achievement
            unlockAchievement('matrixEscape', '🚀 Matrix Escapist', 'Successfully escaped the Matrix realm!')
            
            // Exit matrix after showing message for 3 seconds
            setTimeout(() => {
              setShowMatrix(false)
              setShowGameInstructions(false)
              setSpaceshipPosition({ x: 50, y: 90 })
              setLives(3)
              setDebris([])
              setGameStartTime(null)
              setShowVictoryMessage(false)
            }, 3000)
            
            return { x: prev.x, y: newY }
          }
          
          return { ...prev, y: newY }
        })
      }, 100) // Update every 100ms
      
      return () => clearInterval(moveInterval)
    }
  }, [gameActive, gameStartTime, showVictoryMessage])
  
  // Debris spawning system
  useEffect(() => {
    if (gameActive && !showVictoryMessage) {
      console.log('🟡 Debris spawning system activated')
      
      const spawnDebris = () => {
        console.log('🟡 Attempting to spawn debris...')
        setDebris(prevDebris => {
          // Remove debris that have fallen off screen
          const activeDebris = prevDebris.filter(d => d.y < 110)
          
          console.log('🟡 Current debris count:', activeDebris.length)
          
          // Always spawn if we have less than 40 debris
          if (activeDebris.length >= 40) {
            console.log('🟡 Max 40 debris reached, not spawning')
            return activeDebris
          }
          
          // Spawn 7 new debris at random x positions
          const newDebris = []
          for (let i = 0; i < 7; i++) {
            const debrisObj = {
              id: `debris_${Date.now()}_${Math.random()}_${i}`, // Better unique ID
              x: Math.random() * 70 + 15, // Random x between 15% and 85%
              y: Math.random() * 10 - 15, // Start at TOP only (-15 to -5)
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 4, // Random rotation speed
              pattern: Math.random() > 0.5 ? 'striped' : 'checkered' // Random pattern
            }
            newDebris.push(debrisObj)
            console.log('🟡 Created debris:', debrisObj)
          }
          
          const finalDebris = [...activeDebris, ...newDebris]
          console.log('🟡 Final debris array length:', finalDebris.length)
          console.log('🟡 Final debris array:', finalDebris)
          return finalDebris
        })
      }
      
      // Spawn initial debris immediately
      console.log('🟡 Initial debris spawn')
      spawnDebris()
      
      // Then spawn every 3 seconds
      const spawnInterval = setInterval(() => {
        console.log('🟡 Interval debris spawn')
        spawnDebris()
      }, 3000)
      
      return () => {
        console.log('🟡 Cleaning up debris spawning')
        clearInterval(spawnInterval)
      }
    }
  }, [gameActive, showVictoryMessage])
  
  // Debris movement (separate from collision detection)
  useEffect(() => {
    if (gameActive && !showVictoryMessage) {
      const moveInterval = setInterval(() => {
        setDebris(prevDebris => {
          if (prevDebris.length === 0) return prevDebris
          
          const movedDebris = prevDebris
            .map(d => ({
              ...d,
              y: d.y + 1.2, // Faster fall speed so they're more visible
              rotation: d.rotation + d.rotationSpeed
            }))
            .filter(d => d.y < 110) // Remove debris that fell off screen
          
          console.log('🔴 Moving debris, count:', movedDebris.length)
          return movedDebris
        })
      }, 80) // Faster update rate
      
      return () => clearInterval(moveInterval)
    }
  }, [gameActive, showVictoryMessage])
  
  // Collision detection (separate from movement)
  useEffect(() => {
    if (gameActive && !showVictoryMessage) {
      const collisionInterval = setInterval(() => {
        setDebris(prevDebris => {
          if (prevDebris.length === 0) return prevDebris
          
          // Check for collisions with current spaceship position
          const currentShipX = spaceshipPosition.x
          const currentShipY = spaceshipPosition.y
          
          const hitDebris = prevDebris.find(d => {
            const distanceX = Math.abs(d.x - currentShipX)
            const distanceY = Math.abs(d.y - currentShipY)
            const collision = distanceX < 4 && distanceY < 4 // Reasonable hitbox
            
            if (collision) {
              console.log('💥💥💥 COLLISION DETECTED! 💥💥💥')
              console.log('Ship position:', currentShipX, currentShipY)
              console.log('Debris position:', d.x, d.y)
              console.log('Distance:', distanceX, distanceY)
            }
            
            return collision
          })
          
          if (hitDebris) {
            // Show explosion effect
            setShowExplosion(true)
            setTimeout(() => setShowExplosion(false), 500)
            
            // Handle life loss and restart
            setLives(prevLives => {
              const newLives = prevLives - 1
              console.log('💥 LIVES LOST! New lives:', newLives)
              
              if (newLives <= 0) {
                // Game over - restart completely after explosion
                setTimeout(() => {
                  setGameActive(false)
                  setShowGameInstructions(false)
                  setSpaceshipPosition({ x: 50, y: 90 })
                  setLives(3)
                  setDebris([])
                  setGameStartTime(null)
                  // Restart the sequence
                  setTimeout(() => {
                    setShowGameInstructions(true)
                    setTimeout(() => {
                      setGameActive(true)
                      setGameStartTime(Date.now())
                    }, 3000)
                  }, 1000)
                }, 600)
              } else {
                // Reset position but keep lives after explosion
                setTimeout(() => {
                  setSpaceshipPosition({ x: 50, y: 90 })
                }, 600)
              }
              
              return newLives
            })
            
            // Clear debris immediately on hit
            return []
          }
          
          return prevDebris
        })
      }, 50) // Check more frequently for better collision detection
      
      return () => clearInterval(collisionInterval)
    }
  }, [gameActive, showVictoryMessage, spaceshipPosition.x, spaceshipPosition.y])

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
        
        // Unlock achievement
        unlockAchievement('sandwichMaster', '🥪 Sandwich Master', 'Successfully used sudo powers for snacks!')
        
        // Hide sandwich after 4 seconds
        setTimeout(() => {
          setShowSandwich(false)
        }, 4000)
      } else if (command === 'sudo rm -rf /' || command === 'sudo rm -rf /*') {
        newOutput.push({ text: 'Your computer data is being deleted from your machine...', type: 'error' })
        newOutput.push({ text: 'But chill your data has already found it\'s new owner😁', type: 'system' })
        
        // Set output first to show the messages
        setOutput([...newOutput])
        setInput('')
        
        // Close the website after 3 seconds
        setTimeout(() => {
          // Try multiple methods to "destroy" the page
          document.body.innerHTML = '<div style="background: black; color: red; text-align: center; padding-top: 50vh; font-family: monospace; font-size: 24px;">SYSTEM DESTROYED<br/>Your computer data has been terminated</div>'
          document.title = 'SYSTEM DESTROYED'
          
          // "Close" the website after showing destruction message
          setTimeout(() => {
            // Multiple methods to simulate closing/destroying the page
            try {
              // Try to close first
              window.close()
            } catch(e) {
              // If that fails, do more aggressive methods
            }
            
            // Redirect to blank page
            window.location.replace('about:blank')
            
            // As backup, completely hide everything
            document.documentElement.style.display = 'none'
            
            // And freeze the page
            window.stop()
          }, 2000)
        }, 3000)
        return // Return early to avoid setting output again
      } else if (command === 'help') {
        newOutput.push({ text: 'Available commands:', type: 'system' })
        newOutput.push({ text: '  help - show this super useful message🫠', type: 'system' })
        newOutput.push({ text: '  ls -la - List all projects', type: 'system' })
        newOutput.push({ text: '  skills - Show my skill levels (100% true. Trust💀)', type: 'system' })
        newOutput.push({ text: '  phill - Get inspired by the greatest minds', type: 'system' })
        newOutput.push({ text: '  achv - View your unlocked achievements', type: 'system' })
        newOutput.push({ text: '  [project name] - Open the project URL', type: 'system' })
        newOutput.push({ text: '  type "tips" to get tips for the games', type: 'system' })
        newOutput.push({ text: '  login [username] - Login with a username', type: 'system' })
        newOutput.push({ text: '  logout - Logout and clear user data', type: 'system' })
      } else if (command === 'achv') {
        newOutput.push({ text: 'Achievement Progress:', type: 'system' })
        newOutput.push({ text: '', type: 'system' })
        
        const achievementList = [
          { key: 'matrixEscape', icon: '🚀', title: 'Matrix Escapist', desc: 'Successfully escape the Matrix realm' },
          { key: 'sandwichMaster', icon: '🥪', title: 'Sandwich Master', desc: 'Use sudo powers for snacks' },
          { key: 'philosophySeeker', icon: '🧠', title: 'Philosophy Seeker', desc: 'Seek wisdom from great minds' }
        ]
        
        achievementList.forEach(achievement => {
          const isUnlocked = achievements[achievement.key]
          const status = isUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'
          const title = isUnlocked ? achievement.title : '???'
          const desc = isUnlocked ? achievement.desc : 'Complete the challenge to unlock'
          
          newOutput.push({ 
            text: `  ${achievement.icon} ${title} - ${desc} [${status}]`, 
            type: 'system' 
          })
        })
        
        const unlockedCount = Object.values(achievements).filter(Boolean).length
        newOutput.push({ text: '', type: 'system' })
        newOutput.push({ text: `Progress: ${unlockedCount}/3 achievements unlocked`, type: 'system' })
      } else if (command === 'logout') {
        clearUserData()
        setUsername('')
        setIsLoggedIn(false)
        setLastLogin(null)
        setCommandHistory([])
        setHistoryIndex(-1)
        setAchievements({ matrixEscape: false, sandwichMaster: false, philosophySeeker: false })
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
      } else if (command === 'phill') {
        const randomQuote = getRandomPhillQuote()
        newOutput.push({ text: 'Quote of the moment:', type: 'system' })
        newOutput.push({ text: '', type: 'system' })
        newOutput.push({ text: randomQuote, type: 'system' })
        
        // Unlock achievement
        unlockAchievement('philosophySeeker', '🧠 Philosophy Seeker', 'Sought wisdom from the great minds!')
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
      // Don't focus input when in matrix mode
      if (!showMatrix) {
        focusInput()
      }
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
            disabled={showMatrix}
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
      {showAchievement && (
        <div className={`achievement-overlay ${showAchievement.title.includes('Sandwich') ? 'achievement-bottom' : ''}`}>
          <div className="achievement-notification">
            <div className="achievement-header">🏆 ACHIEVEMENT UNLOCKED!</div>
            <div className="achievement-title">{showAchievement.title}</div>
            <div className="achievement-description">{showAchievement.description}</div>
          </div>
        </div>
      )}
      {showMatrix && (
        <div className="matrix-overlay">
          <div className="matrix-container">
            {/* Only show matrix rain if game is not active (for performance) */}
            {!gameActive && Array.from({ length: 80 }, (_, i) => (
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
            
            {/* Game UI Elements */}
            {gameActive && (
              <>
                {/* Moving starfield background */}
                <div className="starfield">
                  {Array.from({ length: 100 }, (_, i) => (
                    <div
                      key={`star-${i}`}
                      className="star"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 4}s`,
                        opacity: Math.random() * 0.8 + 0.2
                      }}
                    />
                  ))}
                </div>
                
                {/* Portal at the top */}
                <div className="portal" style={{
                  position: 'absolute',
                  top: '5%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ff0000, #ff6666, #ff0000)',
                  animation: 'portal-spin 2s linear infinite',
                  boxShadow: '0 0 20px #ff0000, 0 0 40px #ff0000',
                  zIndex: '10001'
                }} />
                
                {/* Spaceship */}
                <div className="spaceship" style={{
                  position: 'absolute',
                  left: `${spaceshipPosition.x}%`,
                  top: `${spaceshipPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '24px',
                  zIndex: '10001',
                  textShadow: showExplosion ? '0 0 20px #ff0000, 0 0 40px #ff0000' : '0 0 10px #ffff00',
                  animation: showExplosion ? 'explosion-shake 0.5s ease-in-out' : 'none'
                }}>
                  {showExplosion ? '💥' : '🚀'}
                </div>
                
                {/* Debris */}
                {debris.map(d => (
                  <div key={d.id} className="debris" style={{
                    position: 'absolute',
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
                    width: '60px', // Bigger debris for better visibility
                    height: '60px',
                    zIndex: '10000',
                    background: d.pattern === 'striped' 
                      ? 'repeating-linear-gradient(45deg, #000000 0px, #000000 8px, #ffff00 8px, #ffff00 16px)'
                      : 'repeating-conic-gradient(#000000 0% 25%, #ffff00 25% 50%)',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(255, 255, 0, 1), 0 0 25px rgba(255, 255, 0, 0.5)',
                    border: '3px solid #ffff00',
                    opacity: '0.9'
                  }} />
                ))}
                
                {/* Debug info */}
                {gameActive && (
                  <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: '20px',
                    color: '#00ff00',
                    fontSize: '12px',
                    fontFamily: 'Courier New, monospace',
                    textShadow: '0 0 5px #00ff00',
                    zIndex: '10002',
                    textAlign: 'right'
                  }}>
                    <div>Debris: {debris.length}/40</div>
                    <div>Ship: {spaceshipPosition.x.toFixed(1)}, {spaceshipPosition.y.toFixed(1)}</div>
                    <div>Portal: 50.0, 5.0</div>
                    {debris.length > 0 && (
                      <div>
                        Closest: {Math.min(...debris.map(d => 
                          Math.sqrt(Math.pow(d.x - spaceshipPosition.x, 2) + Math.pow(d.y - spaceshipPosition.y, 2))
                        )).toFixed(1)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Lives Display */}
                <div className="lives-display" style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  color: '#00ff00',
                  fontSize: '18px',
                  fontFamily: 'Courier New, monospace',
                  textShadow: '0 0 10px #00ff00',
                  zIndex: '10002'
                }}>
                  Lives: {'❤️'.repeat(lives)}
                </div>
              </>
            )}
            
            <div className="matrix-text">
              {!showGameInstructions && !gameActive && !showVictoryMessage && (
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
              )}
              
              {showGameInstructions && !gameActive && !showVictoryMessage && (
                <div className="game-instructions">
                  <div style={{ marginBottom: '20px', fontSize: '20px' }}>
                    You have been locked into the Matrix realm.
                  </div>
                  <div style={{ marginBottom: '20px', fontSize: '20px' }}>
                    Get to the portal to escape!
                  </div>
                  <div style={{ fontSize: '16px', opacity: '0.8' }}>
                    Move with ← and →, or A D
                  </div>
                </div>
              )}
              
              {showVictoryMessage && (
                <div className="victory-message" style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  color: '#00ff00',
                  textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00',
                  animation: 'matrix-glow 1s ease-in-out infinite alternate'
                }}>
                  <div style={{ marginBottom: '20px' }}>🎉 VICTORY! 🎉</div>
                  <div>You've escaped the matrix,</div>
                  <div>go tell the world!</div>
                </div>
              )}
              
              {showExitText && !gameActive && !showVictoryMessage && <div className="exit-text">Press ESC to exit</div>}
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

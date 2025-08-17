/**
 * Auto Typewriter Script
 * =====================
 * 
 * This script creates an automated typing tool that:
 * - Prompts user for desired typing speed
 * - Creates a draggable UI overlay
 * - Automatically types characters at the specified rate
 * - Provides real-time statistics and controls
 * 
 * Usage: Run this script in the browser console on typewriter.at
 * 
 * Features:
 * - Website detection (only works on typewriter.at)
 * - Customizable typing speed (1-10000 chars per 10 minutes)
 * - Draggable UI with minimize/maximize
 * - Real-time statistics (characters typed, time running, current speed)
 * - Start/Stop controls
 * - Non-intrusive overlay that doesn't interfere with the website
 */

class AutoTypewriter {
    /**
     * Initialize the AutoTypewriter with default values
     * Sets up all the properties needed for the typing automation
     */
    constructor() {
        // Core state management
        this.isRunning = false;        // Tracks if typing is currently active
        this.isPaused = false;         // Tracks if typing is paused
        this.intervalId = null;        // Stores the typing interval for cleanup
        this.observer = null;          // MutationObserver for detecting UI changes
        this.isDarkMode = true;        // Tracks current theme (dark/light)
        
        // Configuration settings
        this.config = {
            charsPerTenMins: 0,        // User's desired typing speed
            msToWait: 0,               // Calculated milliseconds between each character
            targetElement: null,       // The element containing the character to type
            startBox: null             // The start dialog element (if present)
        };
        
        // UI and statistics
        this.ui = null;                // Reference to the created UI overlay
        this.stats = {
            charactersTyped: 0,        // Total characters typed in current session
            startTime: null,           // When typing started (for timing calculations)
            lastTypedTime: null        // Last character typed timestamp
        };
    }

    /**
     * Main initialization method - sets up the entire auto typewriter
     * This is the entry point that gets called when the script starts
     */
    init() {
        try {
            // Step 0: Check if we're on a compatible website
            if (!this.isCompatibleWebsite()) {
                this.showError('This script only works on typewriter.at. Please navigate to typewriter.at and try again.');
                return;
            }
            
            // Step 1: Create the visual UI overlay
            this.createUI();
            
            // Step 2: Get user input and configure typing speed
            this.setupConfiguration();
            
            // Step 3: Update the UI to show the chosen speed
            this.updateSpeedDisplay();
            
            // Step 4: Set up event listeners and observers
            this.setupEventHandling();
            
        } catch (error) {
            // If anything goes wrong, show a user-friendly error message
            this.showError('Initialization failed. Please refresh and try again.');
        }
    }

    /**
     * Creates the visual UI overlay that users interact with
     * Builds a complete HTML structure with embedded CSS for styling
     */
    createUI() {
        // Clean up any existing UI to prevent duplicates
        const existingUI = document.getElementById('auto-typewriter-ui');
        if (existingUI) {
            existingUI.remove();
        }

        // Create the main UI container element
        this.ui = document.createElement('div');
        this.ui.id = 'auto-typewriter-ui';
        this.ui.innerHTML = `
            <style>
                #auto-typewriter-ui {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 300px;
                    background: #1a1a2e;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    user-select: none;
                    pointer-events: auto;
                    will-change: transform;
                }
                
                #auto-typewriter-ui:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.6);
                }
                
                .ui-header {
                    background: rgba(0,0,0,0.3);
                    padding: 15px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    user-select: none;
                }
                
                .ui-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
                
                .ui-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s ease;
                }
                
                .ui-close:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .ui-close, .ui-minimize {
                    user-select: none;
                }
                
                .ui-content {
                    padding: 20px;
                }
                
                .ui-section {
                    margin-bottom: 20px;
                }
                
                .ui-section:last-child {
                    margin-bottom: 0;
                }
                
                .ui-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .ui-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: white;
                    font-size: 14px;
                    box-sizing: border-box;
                    transition: background 0.2s ease;
                    user-select: text;
                }
                
                .ui-input:focus {
                    outline: none;
                    background: rgba(255,255,255,0.2);
                }
                
                .ui-speed-display {
                    width: 100%;
                    padding: 12px 15px;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: #ffffff;
                    font-size: 16px;
                    box-sizing: border-box;
                    text-align: center;
                    font-weight: 600;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .ui-button {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 10px;
                    user-select: none;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .ui-button:last-child {
                    margin-bottom: 0;
                }
                
                .ui-button.primary {
                    background: #4CAF50;
                    color: white;
                }
                
                .ui-button.primary:hover {
                    background: #45a049;
                    transform: translateY(-1px);
                }
                
                .ui-button.danger {
                    background: #f44336;
                    color: white;
                }
                
                .ui-button.warning {
                    background: #ff9800;
                    color: white;
                }
                
                .ui-button.warning:hover {
                    background: #f57c00;
                    transform: translateY(-1px);
                }
                
                .ui-button.danger:hover {
                    background: #da190b;
                    transform: translateY(-1px);
                }
                
                .ui-button:disabled {
                    background: #666;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .ui-stats {
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 18px;
                    font-size: 13px;
                }
                
                .ui-stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .ui-stat:last-child {
                    margin-bottom: 0;
                }
                
                .ui-stat-label {
                    color: #e0e0e0;
                    font-weight: 500;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .ui-stat-value {
                    font-weight: 700;
                    color: #ffffff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                
                .ui-status {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 10px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                
                .ui-status.running {
                    background: #4CAF50;
                    animation: pulse 2s infinite;
                }
                
                .ui-status.stopped {
                    background: #f44336;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .ui-minimize {
                    position: absolute;
                    top: 15px;
                    right: 50px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s ease;
                }
                
                .ui-theme-toggle {
                    position: absolute;
                    top: 15px;
                    right: 80px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s ease;
                }
                
                .ui-theme-toggle:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .ui-minimize:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .ui-minimized {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    overflow: hidden;
                }
                
                .ui-minimized .ui-content {
                    display: none;
                }
                
                .ui-minimized .ui-header {
                    padding: 0;
                    border: none;
                    height: 100%;
                    justify-content: center;
                }
                
                .ui-minimized .ui-title {
                    font-size: 12px;
                }
                
                .ui-minimized .ui-close,
                .ui-minimized .ui-minimize,
                .ui-minimized .ui-theme-toggle {
                    display: none;
                }
                
                .ui-minimized .ui-content {
                    display: none;
                }
                
                .ui-minimized {
                    cursor: pointer;
                }
                
                .ui-minimized:hover {
                    transform: scale(1.05);
                }
                
                /* Ensure the UI doesn't block page scrolling or interactions */
                #auto-typewriter-ui {
                    pointer-events: none;
                    isolation: isolate;
                }
                
                /* Only UI elements should receive pointer events */
                #auto-typewriter-ui .ui-header,
                #auto-typewriter-ui .ui-content,
                #auto-typewriter-ui .ui-button,
                #auto-typewriter-ui .ui-input,
                #auto-typewriter-ui .ui-close,
                #auto-typewriter-ui .ui-minimize {
                    pointer-events: auto;
                }
            </style>
            
                            <div class="ui-header">
                    <h3 class="ui-title">🤖 Auto Typewriter</h3>
                    <button class="ui-theme-toggle" onclick="autoTypewriter.toggleTheme()" title="Toggle Theme">🌙</button>
                    <button class="ui-minimize" onclick="autoTypewriter.toggleMinimize()">−</button>
                    <button class="ui-close" onclick="autoTypewriter.closeUI()">×</button>
                </div>
            
            <div class="ui-content">
                <div class="ui-section">
                    <label class="ui-label">Current Speed:</label>
                    <div class="ui-speed-display" id="speed-display">100 chars per 10 min</div>
                </div>
                
                <div class="ui-section">
                    <button class="ui-button primary" id="start-btn" onclick="autoTypewriter.startTyping()">
                        <span class="ui-status stopped"></span>Start Typing
                    </button>
                    <button class="ui-button warning" id="pause-btn" onclick="autoTypewriter.togglePause()" disabled>
                        Pause
                    </button>
                    <button class="ui-button danger" id="stop-btn" onclick="autoTypewriter.stop()" disabled>
                        Stop Typing
                    </button>
                </div>
                
                <div class="ui-section">
                    <div class="ui-stats">
                        <div class="ui-stat">
                            <span class="ui-stat-label">Status:</span>
                            <span class="ui-stat-value" id="status-text">Stopped</span>
                        </div>
                        <div class="ui-stat">
                            <span class="ui-stat-label">Characters Typed:</span>
                            <span class="ui-stat-value" id="chars-typed">0</span>
                        </div>
                        <div class="ui-stat">
                            <span class="ui-stat-label">Time Running:</span>
                            <span class="ui-stat-value" id="time-running">00:00</span>
                        </div>
                        <div class="ui-stat">
                            <span class="ui-stat-label">Current Speed:</span>
                            <span class="ui-stat-value" id="current-speed">0/min</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add the UI to the page
        document.body.appendChild(this.ui);
        
        // Prevent UI from interfering with the underlying website
        // Only stop event propagation when clicking on actual UI elements
        this.ui.addEventListener('click', (e) => {
            // Check if the click was on a UI element (not empty space)
            if (e.target.closest('.ui-header, .ui-content, .ui-button, .ui-input, .ui-close, .ui-minimize')) {
                e.stopPropagation(); // Prevent click from reaching the website underneath
            }
        });
        
        this.ui.addEventListener('mousedown', (e) => {
            // Same logic for mouse down events
            if (e.target.closest('.ui-header, .ui-content, .ui-button, .ui-input, .ui-close, .ui-minimize')) {
                e.stopPropagation();
            }
        });
        
        // Enable dragging functionality for the UI
        this.setupDrag();
        
        // Start the statistics update loop - updates every second
        this.statsInterval = setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    /**
     * Sets up the drag functionality to make the UI movable
     * Allows users to click and drag the header to reposition the UI
     */
    setupDrag() {
        // Variables to track drag state and position
        let isDragging = false;    // Whether user is currently dragging
        let startX = 0;            // Starting X position when drag begins
        let startY = 0;            // Starting Y position when drag begins
        let currentX = 0;          // Current X offset from original position
        let currentY = 0;          // Current Y offset from original position

        // Get reference to the header element (the draggable area)
        const header = this.ui.querySelector('.ui-header');
        
        /**
         * Handles the start of a drag operation
         * Triggered when user presses mouse down on the header
         */
        const dragStart = (e) => {
            // Only handle drag if clicking on the header area (not buttons)
            if (e.target === header || header.contains(e.target)) {
                e.preventDefault();      // Prevent default browser behavior
                e.stopPropagation();     // Stop event from bubbling up
                
                // Don't start drag if clicking on control buttons
                if (e.target.tagName === 'BUTTON' || 
                    e.target.classList.contains('ui-close') || 
                    e.target.classList.contains('ui-minimize')) {
                    return; // Exit early if clicking on buttons
                }
                
                // Initialize drag state
                isDragging = true;
                startX = e.clientX - currentX;  // Calculate starting position
                startY = e.clientY - currentY;
                this.ui.style.cursor = 'grabbing'; // Visual feedback
            }
        };
        
        /**
         * Handles the end of a drag operation
         * Triggered when user releases the mouse button
         */
        const dragEnd = () => {
            isDragging = false;                    // Stop dragging
            this.ui.style.cursor = 'default';      // Reset cursor
        };
        
        /**
         * Handles the drag movement
         * Triggered when user moves the mouse while dragging
         */
        const drag = (e) => {
            if (!isDragging) return; // Exit if not currently dragging
            
            e.preventDefault();      // Prevent default browser behavior
            e.stopPropagation();     // Stop event from bubbling up
            
            // Calculate new position based on mouse movement
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            
            // Apply the new position using CSS transform
            this.ui.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        };
        
        // Set up mouse event listeners for desktop dragging
        header.addEventListener('mousedown', dragStart);    // Start drag on mouse down
        document.addEventListener('mousemove', drag);       // Update position on mouse move
        document.addEventListener('mouseup', dragEnd);      // End drag on mouse up
        
        // Set up touch event listeners for mobile dragging
        header.addEventListener('touchstart', (e) => {
            const touch = e.touches[0]; // Get the first touch point
            // Convert touch event to mouse-like event for consistency
            dragStart({ 
                clientX: touch.clientX, 
                clientY: touch.clientY, 
                target: e.target,
                preventDefault: () => e.preventDefault(),
                stopPropagation: () => e.stopPropagation()
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault(); // Prevent page scrolling while dragging
                const touch = e.touches[0];
                // Convert touch event to mouse-like event
                drag({ 
                    clientX: touch.clientX, 
                    clientY: touch.clientY,
                    preventDefault: () => e.preventDefault(),
                    stopPropagation: () => e.stopPropagation()
                });
            }
        });
        
        document.addEventListener('touchend', dragEnd); // End drag on touch end
    }
    


    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        
        // Update theme button icon
        const themeBtn = this.ui.querySelector('.ui-theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = this.isDarkMode ? '🌙' : '☀️';
        }
        
        // Apply theme styles
        this.applyTheme();
    }
    
    /**
     * Apply the current theme to the UI
     */
    applyTheme() {
        if (!this.ui) return;
        
        if (this.isDarkMode) {
            // Dark theme
            this.ui.style.background = '#1a1a2e';
            this.ui.style.color = '#ffffff';
            
            // Update text colors for dark theme
            const labels = this.ui.querySelectorAll('.ui-label');
            const speedDisplay = this.ui.querySelector('.ui-speed-display');
            const statLabels = this.ui.querySelectorAll('.ui-stat-label');
            const statValues = this.ui.querySelectorAll('.ui-stat-value');
            const title = this.ui.querySelector('.ui-title');
            const buttons = this.ui.querySelectorAll('.ui-button');
            
            labels.forEach(label => label.style.color = '#e0e0e0');
            statLabels.forEach(label => label.style.color = '#e0e0e0');
            statValues.forEach(value => value.style.color = '#ffffff');
            if (speedDisplay) speedDisplay.style.color = '#ffffff';
            if (title) title.style.color = '#ffffff';
            
        } else {
            // Light theme
            this.ui.style.background = '#ffffff';
            this.ui.style.color = '#000000';
            
            // Update text colors for light theme
            const labels = this.ui.querySelectorAll('.ui-label');
            const speedDisplay = this.ui.querySelector('.ui-speed-display');
            const statLabels = this.ui.querySelectorAll('.ui-stat-label');
            const statValues = this.ui.querySelectorAll('.ui-stat-value');
            const title = this.ui.querySelector('.ui-title');
            const buttons = this.ui.querySelectorAll('.ui-button');
            
            labels.forEach(label => label.style.color = '#333333');
            statLabels.forEach(label => label.style.color = '#333333');
            statValues.forEach(value => value.style.color = '#000000');
            if (speedDisplay) speedDisplay.style.color = '#000000';
            if (title) title.style.color = '#000000';
        }
    }

    /**
     * Toggle minimize/maximize UI
     */
    toggleMinimize() {
        this.ui.classList.toggle('ui-minimized');
        const minimizeBtn = this.ui.querySelector('.ui-minimize');
        minimizeBtn.textContent = this.ui.classList.contains('ui-minimized') ? '+' : '−';
        
        // Add click handler to restore when minimized
        if (this.ui.classList.contains('ui-minimized')) {
            this.ui.addEventListener('click', this.restoreFromMinimized.bind(this), { once: true });
        }
    }
    
    /**
     * Restore UI from minimized state
     */
    restoreFromMinimized(e) {
        // Don't restore if clicking on buttons
        if (e.target.classList.contains('ui-minimize') || 
            e.target.classList.contains('ui-close') || 
            e.target.classList.contains('ui-theme-toggle')) {
            return;
        }
        
        this.ui.classList.remove('ui-minimized');
        const minimizeBtn = this.ui.querySelector('.ui-minimize');
        minimizeBtn.textContent = '−';
    }

    /**
     * Close the UI
     */
    closeUI() {
        this.stop();
        if (this.ui) {
            this.ui.remove();
            this.ui = null;
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        if (!this.ui) return;

        const statusText = this.ui.querySelector('#status-text');
        const charsTyped = this.ui.querySelector('#chars-typed');
        const timeRunning = this.ui.querySelector('#time-running');
        const currentSpeed = this.ui.querySelector('#current-speed');
        const startBtn = this.ui.querySelector('#start-btn');
        const stopBtn = this.ui.querySelector('#stop-btn');
        const pauseBtn = this.ui.querySelector('#pause-btn');
        const statusIndicator = startBtn.querySelector('.ui-status');

        // Update status
        if (this.isRunning) {
            if (this.isPaused) {
                statusText.textContent = 'Paused';
                statusIndicator.className = 'ui-status stopped';
            } else {
                statusText.textContent = 'Running';
                statusIndicator.className = 'ui-status running';
            }
            startBtn.disabled = true;
            stopBtn.disabled = false;
            pauseBtn.disabled = false;
        } else {
            statusText.textContent = 'Stopped';
            statusIndicator.className = 'ui-status stopped';
            startBtn.disabled = false;
            stopBtn.disabled = true;
            pauseBtn.disabled = true;
        }

        // Update characters typed
        charsTyped.textContent = this.stats.charactersTyped;

        // Update time running
        if (this.stats.startTime && this.isRunning) {
            const elapsed = Date.now() - this.stats.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            timeRunning.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeRunning.textContent = '00:00';
        }

        // Update current speed
        if (this.stats.startTime && this.isRunning && !this.isPaused) {
            const elapsed = Date.now() - this.stats.startTime;
            const minutes = elapsed / 60000;
            const speed = minutes > 0 ? Math.round(this.stats.charactersTyped / minutes) : 0;
            currentSpeed.textContent = `${speed}/min`;
        } else {
            currentSpeed.textContent = '0/min';
        }
    }



    /**
     * Check if the current website is compatible with this script
     * Only allows the script to run on typewriter.at
     */
    isCompatibleWebsite() {
        const currentUrl = window.location.href.toLowerCase();
        const hostname = window.location.hostname.toLowerCase();
        
        // Check if we're on typewriter.at
        if (hostname.includes('typewriter.at') || currentUrl.includes('typewriter.at')) {
            return true;
        }
        
        return false;
    }

    /**
     * Setup configuration with user input validation
     */
    setupConfiguration() {
        // Find required elements
        this.config.startBox = document.querySelector(".ui-dialog[aria-describedby='startDialog']");
        this.config.targetElement = document.querySelector("#text_todo_1")?.children[0];

        if (!this.config.targetElement) {
            throw new Error('Target element not found. Make sure the typing interface is loaded.');
        }

        // Get user input with prompt
let charsPerTenMins;
do {
    charsPerTenMins = parseInt(prompt("How many characters per 10 minutes would you like to achieve?"));
        } while (isNaN(charsPerTenMins) || charsPerTenMins <= 0 || charsPerTenMins > 10000);

        this.config.charsPerTenMins = charsPerTenMins;
        this.config.msToWait = 600000 / this.config.charsPerTenMins;
    }

    /**
     * Update speed display with current configuration
     */
    updateSpeedDisplay() {
        const speedDisplay = this.ui.querySelector('#speed-display');
        if (speedDisplay) {
            speedDisplay.textContent = `${this.config.charsPerTenMins} chars per 10 min`;
        }
    }

    /**
     * Validate user input
     */
    isValidInput(input) {
        const num = parseInt(input);
        return !isNaN(num) && num > 0 && num <= 1000;
    }

    /**
     * Setup event handling for start box visibility
     */
    setupEventHandling() {
        if (this.config.startBox && this.config.startBox.style.display !== "none") {
            // Start box is visible, wait for it to disappear
            this.setupObserver();
        } else {
            // Start box is not visible, ready to start
        }
    }

    /**
     * Setup mutation observer to detect when start box disappears
     */
    setupObserver() {
        const config = { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['style'] 
        };

        this.observer = new MutationObserver((mutations, observer) => {
            observer.disconnect();
        });

        this.observer.observe(this.config.startBox, config);
    }

    /**
     * Start the typing process
     */
    startTyping() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.stats.startTime = Date.now();
        this.stats.charactersTyped = 0;

        this.intervalId = setInterval(() => {
            if (!this.isPaused) {
                this.typeNextCharacter();
            }
        }, this.config.msToWait);
    }

    /**
     * Type the next character
     */
    typeNextCharacter() {
        try {
            const keyToPress = this.config.targetElement.innerHTML;
            
            if (!keyToPress) {
                return;
            }

            // Create and dispatch keyboard event
            const event = new KeyboardEvent("keypress", {
                key: keyToPress,
                keyCode: keyToPress === ' ' ? 32 : keyToPress.charCodeAt(0),
            altKey: false,
            ctrlKey: false,
                shiftKey: false,
                metaKey: false,
                bubbles: true,
                cancelable: true
            });

            const activeElement = document.activeElement;
            if (activeElement) {
                activeElement.dispatchEvent(event);
                this.stats.charactersTyped++;
                this.stats.lastTypedTime = Date.now();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    /**
     * Toggle pause/resume functionality
     */
    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        // Update button text
        const pauseBtn = this.ui.querySelector('#pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }

    /**
     * Stop the auto typewriter
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.isRunning = false;
        this.isPaused = false;
    }

    /**
     * Show error message to user
     */
    showError(message) {
        alert(`Auto Typewriter Error: ${message}`);
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            charsPerTenMins: this.config.charsPerTenMins,
            msToWait: this.config.msToWait,
            targetElement: !!this.config.targetElement,
            charactersTyped: this.stats.charactersTyped,
            timeRunning: this.stats.startTime ? Date.now() - this.stats.startTime : 0
        };
    }
}

// Create and initialize the auto typewriter
const autoTypewriter = new AutoTypewriter();

// Add global functions for manual control
window.stopAutoTypewriter = () => autoTypewriter.stop();
window.getAutoTypewriterStatus = () => autoTypewriter.getStatus();

// Initialize the auto typewriter
autoTypewriter.init();


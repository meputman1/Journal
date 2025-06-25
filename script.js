// Enhanced Journal App JavaScript

// Authentication state
let currentUser = null;
let isAuthenticated = false;

// DOM elements for authentication
const authOverlay = document.getElementById('authOverlay');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Global variables
let journalEntries = [];
let selectedMood = '';
let selectedTags = [];
let currentDate = new Date();
let selectedCalendarDate = null;
let calendarDayElements = [];
const privacyModeToggle = document.getElementById('privacyModeToggle');
const privacyLockedMessage = document.getElementById('privacyLockedMessage');
let privacyMode = sessionStorage.getItem('privacyMode') === 'true';
let privacyPin = sessionStorage.getItem('privacyPin') || null;

// Security: Add salt for password hashing
const PASSWORD_SALT = 'journal_app_salt_2024';

// Rate limiting for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Encryption for journal entries - key derived from user password
let userEncryptionKey = null;

// DOM elements for password management
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const changePasswordLink = document.getElementById('changePasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const changePasswordModal = document.getElementById('changePasswordModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const changePasswordForm = document.getElementById('changePasswordForm');

// DOM elements for test user creation
const testUserForm = document.getElementById('testUserForm');
const testUserEmail = document.getElementById('testUserEmail');
const testUserPassword = document.getElementById('testUserPassword');
const testUserError = document.getElementById('testUserError');

// Improved password validation
function isValidPassword(password) {
    // At least 8 characters, with at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Rate limiting function
function isRateLimited(email) {
    const attempts = loginAttempts.get(email);
    if (!attempts) return false;
    
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeSinceFirstAttempt = Date.now() - attempts.firstAttempt;
        if (timeSinceFirstAttempt < LOCKOUT_DURATION) {
            return true;
        } else {
            // Reset after lockout period
            loginAttempts.delete(email);
            return false;
        }
    }
    return false;
}

// Record login attempt
function recordLoginAttempt(email, success) {
    if (success) {
        loginAttempts.delete(email);
        return;
    }
    
    const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;
    loginAttempts.set(email, attempts);
}

// Simple SHA-256 hashing function (for demo purposes - in production, use a proper crypto library)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + PASSWORD_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Input sanitization function
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

// Session management
function createSession(user) {
    const session = {
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    sessionStorage.setItem('session', JSON.stringify(session));
    return session;
}

function getSession() {
    const sessionData = sessionStorage.getItem('session');
    if (!sessionData) return null;
    
    try {
        const session = JSON.parse(sessionData);
        if (new Date(session.expiresAt) < new Date()) {
            sessionStorage.removeItem('session');
            return null;
        }
        return session;
    } catch (error) {
        sessionStorage.removeItem('session');
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem('session');
}

// DOM elements
const journalForm = document.getElementById('journalForm');
const entryText = document.getElementById('entryText');
const selectedMoodInput = document.getElementById('selectedMood');
const selectedTagsInput = document.getElementById('selectedTagsInput');
const selectedTagsContainer = document.getElementById('selectedTags');
const customTagInput = document.getElementById('customTagInput');
const addCustomTagBtn = document.getElementById('addCustomTag');
const entriesContainer = document.getElementById('entriesContainer');
const noEntries = document.getElementById('noEntries');
const searchInput = document.getElementById('searchInput');
const moodButtons = document.querySelectorAll('.mood-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const tagButtons = document.querySelectorAll('.tag-btn');
const tagFilterButtons = document.querySelectorAll('.tag-filter-btn');

// Calendar elements
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarDaysContainer = document.getElementById('calendarDays');

// Add these at the top with other DOM elements
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

// Chart instances
let moodTrendsChart = null;
let tagFrequencyChart = null;

// Chart colors matching the app theme
const chartColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#48bb78',
    background: '#f7f9fc',
    border: '#e2e8f0',
    text: '#4a5568'
};

// Mood colors for the chart
const moodColors = {
    happy: '#48bb78',
    sad: '#4299e1',
    excited: '#ed8936',
    anxious: '#ed64a6',
    grateful: '#9f7aea',
    numb: '#a0aec0',
    angry: '#f56565',
    motivated: '#38b2ac',
    loved: '#f687b3',
    overwhelmed: '#ed8936',
    lonely: '#4299e1',
    bored: '#a0aec0',
    sick: '#ed8936',
    disappointed: '#a0aec0',
    frustrated: '#ed8936',
    content: '#48bb78',
    focused: '#4299e1',
    stressed: '#ed64a6',
    creative: '#9f7aea'
};

// Trends state
let currentDateRange = 'month';
let comparisonEnabled = false;
let customStartDate = null;
let customEndDate = null;

// DOM elements for trends
const dateRangeSelect = document.getElementById('dateRangeSelect');
const customDateRange = document.getElementById('customDateRange');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const comparisonToggle = document.getElementById('comparisonToggle');
const moodChartLegend = document.getElementById('moodChartLegend');
const tagChartLegend = document.getElementById('tagChartLegend');

// Password migration function for existing users
async function migratePasswords() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        let hasChanges = false;
        
        for (let user of users) {
            // Check if password is not hashed (plain text passwords are typically shorter than 64 chars)
            if (user.password && user.password.length < 64) {
                console.log('Migrating password for user:', user.email);
                user.password = await hashPassword(user.password);
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Password migration completed');
        }
    } catch (error) {
        console.error('Error during password migration:', error);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Migrate existing passwords first
    await migratePasswords();
    
    checkAuthState();
    setupAuthEventListeners();
    setupEventListeners();
});

/**
 * Check authentication state on page load
 */
function checkAuthState() {
    // Ensure DOM elements exist
    if (!authOverlay || !mainApp) {
        console.error('Auth overlay or main app elements not found');
        return;
    }
    
    // Check for valid session
    const session = getSession();
    console.log('checkAuthState: session from sessionStorage:', session);
    
    if (session) {
        try {
            // Verify user still exists in localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === session.userId);
            
            if (user) {
                currentUser = { id: user.id, email: user.email };
                isAuthenticated = true;
                console.log('checkAuthState: User loaded from session:', currentUser);
                showMainApp();
            } else {
                console.log('checkAuthState: User not found in localStorage, clearing session');
                clearSession();
                showAuthOverlay();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            clearSession();
            showAuthOverlay();
        }
    } else {
        console.log('checkAuthState: No valid session found, showing auth overlay');
        showAuthOverlay();
    }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', logout);
    
    // Handle password toggle buttons
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            togglePassword(targetId);
        });
    });
}

/**
 * Show authentication overlay
 */
function showAuthOverlay() {
    if (!authOverlay || !mainApp) {
        console.error('Auth elements not found');
        return;
    }
    authOverlay.style.display = 'flex';
    mainApp.style.display = 'none';
    console.log('Auth overlay shown');
}

/**
 * Show main app
 */
function showMainApp() {
    if (!authOverlay || !mainApp) {
        console.error('Auth elements not found');
        return;
    }
    authOverlay.style.display = 'none';
    mainApp.style.display = 'block';
    console.log('Main app shown');
    
    if (currentUser) {
        userEmail.textContent = currentUser.email;
        console.log('Current user:', currentUser.email);
    }
    
    // Initialize app features
    console.log('Loading entries...');
    loadEntries();
    console.log('Entries loaded, count:', journalEntries.length);
    
    console.log('Rendering calendar...');
    renderCalendar();
    
    console.log('Displaying entries...');
    displayEntries();
    
    populateMonthYearSelectors();
    syncMonthYearSelectors();
    updatePrivacyModeUI();
    initializeCharts();
    
    // Privacy Mode setup
    if (privacyModeToggle) {
        privacyModeToggle.setAttribute('aria-pressed', privacyMode ? 'true' : 'false');
        privacyModeToggle.addEventListener('click', togglePrivacyMode);
    }
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '🙉';
    }
}

/**
 * Clear authentication error messages
 */
function clearAuthErrors() {
    loginError.textContent = '';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if any users exist in localStorage
 */
function checkIfUsersExist() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.length > 0;
    } catch (error) {
        console.error('Error checking users:', error);
        return false;
    }
}

/**
 * Handle first-time setup (create initial user)
 */
async function handleFirstTimeSetup(email, password) {
    try {
        // Hash the password
        const hashedPassword = await hashPassword(password);
        
        // Set encryption key for this user
        await setUserEncryptionKey(password);
        
        // Create new user
        const newUser = {
            id: Date.now(),
            email: email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        // Save user
        localStorage.setItem('users', JSON.stringify([newUser]));
        
        // Create session and log in user
        const session = createSession(newUser);
        currentUser = { id: newUser.id, email: newUser.email };
        console.log('Initial user created and logged in:', currentUser);
        isAuthenticated = true;
        
        showMainApp();
        showSuccessMessage('Account created successfully! Welcome to your personal journal.');
    } catch (error) {
        console.error('Error during first-time setup:', error);
        loginError.textContent = 'An error occurred during setup. Please try again.';
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    clearAuthErrors();
    
    const email = sanitizeInput(loginEmail.value);
    const password = loginPassword.value;
    
    // Check rate limiting
    if (isRateLimited(email)) {
        loginError.textContent = 'Too many failed login attempts. Please try again in 15 minutes.';
        return;
    }
    
    // Validation
    if (!isValidEmail(email)) {
        loginError.textContent = 'Please enter a valid email address.';
        return;
    }
    
    if (!password) {
        loginError.textContent = 'Please enter your password.';
        return;
    }
    
    try {
        // Check if any users exist
        const usersExist = checkIfUsersExist();
        
        if (!usersExist) {
            // First-time setup - create initial user
            if (!isValidPassword(password)) {
                loginError.textContent = 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.';
                return;
            }
            await handleFirstTimeSetup(email, password);
            return;
        }
        
        // Normal login flow
        const hashedPassword = await hashPassword(password);
        
        // Check credentials
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (!user) {
            recordLoginAttempt(email, false);
            loginError.textContent = 'Invalid email or password.';
            return;
        }
        
        // Successful login
        recordLoginAttempt(email, true);
        
        // Set encryption key for this user
        await setUserEncryptionKey(password);
        
        // Create session and log in user
        const session = createSession(user);
        currentUser = { id: user.id, email: user.email };
        console.log('User logged in:', currentUser);
        isAuthenticated = true;
        
        showMainApp();
        showSuccessMessage('Welcome back!');
    } catch (error) {
        console.error('Error during login:', error);
        loginError.textContent = 'An error occurred during login. Please try again.';
    }
}

// Clear sensitive data function
function clearSensitiveData() {
    // Clear all form inputs
    if (loginForm) loginForm.reset();
    
    // Clear any sensitive variables
    selectedMood = '';
    selectedTags = [];
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
        // Clear any other sensitive data that might be cached
        sessionStorage.removeItem('tempData');
    }
}

/**
 * Handle logout
 */
function logout() {
    currentUser = null;
    isAuthenticated = false;
    userEncryptionKey = null; // Clear encryption key
    clearSession(); // Clear session instead of localStorage
    sessionStorage.removeItem('privacyMode');
    sessionStorage.removeItem('privacyPin');
    
    // Clear sensitive data
    clearSensitiveData();
    
    showAuthOverlay();
    clearAuthErrors();
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    journalForm.addEventListener('submit', handleFormSubmit);
    
    moodButtons.forEach(button => {
        button.addEventListener('click', handleMoodSelection);
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterSelection);
    });
    
    tagButtons.forEach(button => {
        button.addEventListener('click', handleTagSelection);
    });
    
    tagFilterButtons.forEach(button => {
        button.addEventListener('click', handleTagFilterSelection);
    });
    
    addCustomTagBtn.addEventListener('click', handleCustomTagAdd);
    customTagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCustomTagAdd();
        }
    });
    
    searchInput.addEventListener('input', filterEntries);
    
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));

    // Privacy Mode setup
    if (privacyModeToggle) {
        privacyModeToggle.setAttribute('aria-pressed', privacyMode ? 'true' : 'false');
        privacyModeToggle.addEventListener('click', togglePrivacyMode);
    }

    // Setup trends event listeners
    setupTrendsEventListeners();

    // Setup password management event listeners
    setupPasswordManagementEventListeners();

    // Setup test user creation event listeners
    setupTestUserEventListeners();
}

/**
 * Handles mood button selection in the form
 */
function handleMoodSelection(event) {
    const clickedButton = event.target.closest('.mood-btn');
    if (!clickedButton) return;
    
    const mood = clickedButton.dataset.mood;
    
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    clickedButton.classList.add('selected');
    
    selectedMood = mood;
    selectedMoodInput.value = mood;
}

/**
 * Handles filter button selection
 */
function handleFilterSelection(event) {
    const clickedButton = event.target.closest('.filter-btn');
    if (!clickedButton) return;

    filterButtons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    filterEntries();
}

/**
 * Handles tag button selection in the form
 */
function handleTagSelection(event) {
    const clickedButton = event.target.closest('.tag-btn');
    if (!clickedButton) return;
    
    const tag = clickedButton.dataset.tag;
    
    if (selectedTags.includes(tag)) {
        // Remove tag
        selectedTags = selectedTags.filter(t => t !== tag);
        clickedButton.classList.remove('selected');
    } else {
        // Add tag
        selectedTags.push(tag);
        clickedButton.classList.add('selected');
    }
    
    updateSelectedTagsDisplay();
    updateSelectedTagsInput();
}

/**
 * Handles custom tag addition
 */
function handleCustomTagAdd() {
    const customTag = customTagInput.value.trim().toLowerCase();
    if (!customTag) return;
    
    // Remove # if user included it
    const cleanTag = customTag.startsWith('#') ? customTag.slice(1) : customTag;
    
    if (!selectedTags.includes(cleanTag)) {
        selectedTags.push(cleanTag);
        updateSelectedTagsDisplay();
        updateSelectedTagsInput();
    }
    
    customTagInput.value = '';
}

/**
 * Updates the visual display of selected tags
 */
function updateSelectedTagsDisplay() {
    selectedTagsContainer.innerHTML = '';
    selectedTags.forEach(tag => {
        const tagPill = document.createElement('div');
        tagPill.className = 'tag-pill';
        tagPill.innerHTML = `
            <span>#${tag}</span>
            <button type="button" class="remove-tag" onclick="removeTag('${tag}')">×</button>
        `;
        selectedTagsContainer.appendChild(tagPill);
    });
}

/**
 * Updates the hidden input with selected tags
 */
function updateSelectedTagsInput() {
    selectedTagsInput.value = JSON.stringify(selectedTags);
}

/**
 * Removes a tag from selection
 */
function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    
    // Update button state
    const tagButton = document.querySelector(`.tag-btn[data-tag="${tag}"]`);
    if (tagButton) {
        tagButton.classList.remove('selected');
    }
    
    updateSelectedTagsDisplay();
    updateSelectedTagsInput();
}

/**
 * Handles tag filter selection
 */
function handleTagFilterSelection(event) {
    const clickedButton = event.target.closest('.tag-filter-btn');
    if (!clickedButton) return;
    
    tagFilterButtons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    filterEntries();
}

/**
 * Handles the form submission
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    const text = sanitizeInput(entryText.value);
    const mood = selectedMood;
    const tags = selectedTags;
    
    if (!text.trim()) {
        showSuccessMessage('Please enter some text for your journal entry.');
        return;
    }
    
    if (!mood) {
        showSuccessMessage('Please select a mood for your entry.');
        return;
    }
    
    const entry = {
        id: Date.now(),
        text: text,
        mood: mood,
        tags: tags,
        date: new Date().toISOString(),
        dateString: new Date().toISOString().split('T')[0]
    };
    
    journalEntries.unshift(entry);
    saveEntries();
    
    // Reset form
    journalForm.reset();
    selectedMood = '';
    selectedTags = [];
    selectedMoodInput.value = '';
    selectedTagsInput.value = '';
    selectedTagsContainer.innerHTML = '';
    
    // Reset mood and tag button states
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    tagButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Update display
    displayEntries();
    renderCalendar();
    updateCharts();
    
    showSuccessMessage('Journal entry saved successfully!');
}

/**
 * Save entries to localStorage
 */
function saveEntries() {
    const key = getStorageKey();
    console.log('Saving entries with storage key:', key);
    
    // Encrypt entries before saving
    const entriesToSave = journalEntries.map(entry => ({
        ...entry,
        text: encryptText(entry.text),
        tags: entry.tags ? entry.tags.map(tag => encryptText(tag)) : []
    }));
    
    localStorage.setItem(key, JSON.stringify(entriesToSave));
    console.log('Entries saved, count:', entriesToSave.length);
}

/**
 * Load entries from localStorage
 */
function loadEntries() {
    const key = getStorageKey();
    console.log('Loading entries with storage key:', key);
    
    try {
        const savedEntries = localStorage.getItem(key);
        console.log('Saved entries found:', savedEntries ? 'yes' : 'no');
        
        if (savedEntries) {
            const parsedEntries = JSON.parse(savedEntries);
            
            // Decrypt entries after loading
            journalEntries = parsedEntries.map(entry => ({
                ...entry,
                text: decryptText(entry.text),
                tags: entry.tags ? entry.tags.map(tag => decryptText(tag)) : []
            }));
            
            console.log('Entries loaded, count:', journalEntries.length);
        } else {
            console.log('No saved entries found, initialized empty array');
            journalEntries = [];
        }
    } catch (error) {
        console.error('Error loading entries from localStorage:', error);
        journalEntries = [];
    }
}

function showCalendarLoading() {
    const loading = document.getElementById('calendarLoading');
    if (loading) loading.classList.add('active');
}
function hideCalendarLoading() {
    const loading = document.getElementById('calendarLoading');
    if (loading) loading.classList.remove('active');
}

function animateCalendarGrid() {
    const grid = document.getElementById('calendarDays');
    if (grid) {
        grid.classList.remove('fade-in');
        void grid.offsetWidth; // force reflow
        grid.classList.add('fade-in');
    }
}

// Keyboard navigation helpers
function focusCalendarDay(index) {
    if (calendarDayElements[index]) {
        calendarDayElements[index].focus();
    }
}

function getDayIndexByDateString(dateString) {
    return calendarDayElements.findIndex(el => el.dataset.datestring === dateString);
}

// Update renderCalendar to support ARIA, keyboard, selection, animation, loading
function renderCalendar() {
    syncMonthYearSelectors();
    showCalendarLoading();
    setTimeout(() => {
        if (!calendarDaysContainer) {
            console.error("Calendar container not found!");
            hideCalendarLoading();
            return;
        }
        calendarDaysContainer.innerHTML = '';
        calendarDayElements = [];
        calendarDaysContainer.setAttribute('role', 'grid');
        calendarDaysContainer.setAttribute('aria-label', 'Calendar days');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        let cells = 0;
        // Insert blank divs before the 1st
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.setAttribute('role', 'gridcell');
            emptyDay.setAttribute('tabindex', '-1');
            calendarDaysContainer.appendChild(emptyDay);
            calendarDayElements.push(emptyDay);
            cells++;
        }
        // Render days 1–N
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.setAttribute('role', 'gridcell');
            dayElement.setAttribute('tabindex', '-1');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayElement.dataset.datestring = dateString;
            if (journalEntries.some(entry => entry.dateString === dateString)) {
                dayElement.classList.add('has-entries');
            }
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayElement.classList.add('today');
            }
            if (selectedCalendarDate === dateString) {
                dayElement.classList.add('selected');
                dayElement.setAttribute('aria-selected', 'true');
            } else {
                dayElement.setAttribute('aria-selected', 'false');
            }
            dayElement.addEventListener('click', () => {
                selectCalendarDate(dateString);
            });
            dayElement.addEventListener('keydown', (e) => {
                const idx = calendarDayElements.indexOf(dayElement);
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    focusCalendarDay((idx + 1) % 35);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    focusCalendarDay((idx + 34) % 35);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    focusCalendarDay((idx + 7) % 35);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    focusCalendarDay((idx + 28) % 35);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCalendarDate(dateString);
                }
            });
            calendarDaysContainer.appendChild(dayElement);
            calendarDayElements.push(dayElement);
            cells++;
        }
        // Fill the rest of the 35 cells with blank divs
        while (cells < 35) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.setAttribute('role', 'gridcell');
            emptyDay.setAttribute('tabindex', '-1');
            calendarDaysContainer.appendChild(emptyDay);
            calendarDayElements.push(emptyDay);
            cells++;
        }
        animateCalendarGrid();
        hideCalendarLoading();
        // Focus the selected day or today by default
        let focusIdx = getDayIndexByDateString(selectedCalendarDate);
        if (focusIdx === -1) {
            // If no selected, focus today if in this month
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth()) {
                focusIdx = getDayIndexByDateString(`${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            }
        }
        if (focusIdx !== -1) {
            setTimeout(() => focusCalendarDay(focusIdx), 10);
        }
        updatePrivacyModeUI();
    }, 300);
}

/**
 * Navigates the calendar month
 */
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    updateCharts();
}

/**
 * Selects a date on the calendar
 */
function selectCalendarDate(dateString) {
    selectedCalendarDate = selectedCalendarDate === dateString ? null : dateString;
    renderCalendar();
    filterEntries();
}

/**
 * Displays journal entries
 */
function displayEntries(entriesToShow) {
    const entries = entriesToShow || journalEntries;
    console.log('displayEntries called with:', entries.length, 'entries');
    console.log('entriesToShow:', entriesToShow ? entriesToShow.length : 'null');
    console.log('journalEntries:', journalEntries.length);
    
    if(!entriesContainer) {
        console.error('entriesContainer not found');
        return;
    }
    
    if(!noEntries) {
        console.error('noEntries element not found');
        return;
    }
    
    entriesContainer.innerHTML = '';

    if (entries.length === 0) {
        console.log('No entries to display, showing no entries message');
        noEntries.style.display = 'block';
        let message = 'No journal entries yet. Start writing!';
        if (selectedCalendarDate) {
            message = `No entries for ${formatDate(selectedCalendarDate)}.`;
        } else if (searchInput.value || document.querySelector('.filter-btn.active:not([data-mood=""])')) {
            message = 'No entries match your search or filter.';
        }
        noEntries.querySelector('p').textContent = message;
    } else {
        console.log('Displaying', entries.length, 'entries');
        noEntries.style.display = 'none';
        entries.forEach(entry => {
            const entryCard = createEntryCard(entry);
            entriesContainer.appendChild(entryCard);
        });
    }
    updatePrivacyModeUI();
}

/**
 * Creates an entry card element
 */
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    const moodInfo = getMoodInfo(entry.mood);
    
    // Create tags display
    let tagsHtml = '';
    if (entry.tags && entry.tags.length > 0) {
        tagsHtml = '<div class="entry-tags">';
        entry.tags.forEach(tag => {
            tagsHtml += `<span class="entry-tag">#${tag}</span>`;
        });
        tagsHtml += '</div>';
    }
    
    card.innerHTML = `
        <div class="entry-header">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-mood" title="${moodInfo.name}">${moodInfo.emoji}</span>
        </div>
        <div class="entry-text">${entry.text.replace(/\n/g, '<br>')}</div>
        ${tagsHtml}
    `;
    return card;
}

/**
 * Gets mood info (emoji and name)
 */
function getMoodInfo(mood) {
    const moods = {
        'happy': { emoji: '😊', name: 'Happy' },
        'sad': { emoji: '😢', name: 'Sad' },
        'excited': { emoji: '🤩', name: 'Excited' },
        'calm': { emoji: '😌', name: 'Calm' },
        'anxious': { emoji: '😰', name: 'Anxious' },
        'grateful': { emoji: '🙏', name: 'Grateful' },
        'neutral': { emoji: '😐', name: 'Neutral' },
        'angry': { emoji: '😡', name: 'Angry' },
        'motivated': { emoji: '😤', name: 'Motivated' },
        'in-love': { emoji: '😍', name: 'In Love' },
        'reflective': { emoji: '🤔', name: 'Reflective' },
        'tired': { emoji: '😴', name: 'Tired' },
        'overwhelmed': { emoji: '🤯', name: 'Overwhelmed' },
        'proud': { emoji: '🥳', name: 'Proud' },
        'numb': { emoji: '😶‍🌫️', name: 'Numb' },
        'default': { emoji: '❓', name: 'Unknown' }
    };
    return moods[mood] || moods['default'];
}

/**
 * Filters entries based on all criteria
 */
function filterEntries() {
    let filtered = [...journalEntries];
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(entry => {
            const textMatch = entry.text.toLowerCase().includes(searchTerm);
            const tagMatch = entry.tags && entry.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm.replace('#', ''))
            );
            return textMatch || tagMatch;
        });
    }
    
    const activeFilterButton = document.querySelector('.filter-btn.active');
    const moodFilter = activeFilterButton ? activeFilterButton.dataset.mood : '';
    if (moodFilter) {
        filtered = filtered.filter(entry => entry.mood === moodFilter);
    }
    
    const activeTagFilterButton = document.querySelector('.tag-filter-btn.active');
    const tagFilter = activeTagFilterButton ? activeTagFilterButton.dataset.tag : '';
    if (tagFilter) {
        filtered = filtered.filter(entry => 
            entry.tags && entry.tags.includes(tagFilter)
        );
    }
    
    if (selectedCalendarDate) {
        filtered = filtered.filter(entry => entry.dateString === selectedCalendarDate);
    }

    displayEntries(filtered);
}

/**
 * Shows a temporary success message
 */
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Formats a date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
}

/**
 * Utility function to clear all entries (for debugging/testing)
 * Uncomment the line below to add a clear button to the UI
 */
// function clearAllEntries() {
//     if (confirm('Are you sure you want to delete all journal entries? This cannot be undone.')) {
//         journalEntries = [];
//         saveEntries();
//         displayEntries();
//         showSuccessMessage('All entries cleared!');
//     }
// }

// Export functions for potential future use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveEntries,
        loadEntries,
        displayEntries,
        filterEntries,
        createEntryCard,
        getMoodInfo,
        formatDate
    };
}

// Populate month and year dropdowns
function populateMonthYearSelectors() {
    // Months
    const monthNames = Array.from({length: 12}, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
    monthSelect.innerHTML = '';
    monthNames.forEach((name, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = name;
        monthSelect.appendChild(opt);
    });
    // Years (choose a reasonable range)
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 20;
    yearSelect.innerHTML = '';
    for (let y = startYear; y <= endYear; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }
}

// Sync dropdowns with currentDate
function syncMonthYearSelectors() {
    monthSelect.value = currentDate.getMonth();
    yearSelect.value = currentDate.getFullYear();
}

// Update calendar when dropdowns change
monthSelect.addEventListener('change', function() {
    currentDate.setMonth(parseInt(monthSelect.value));
    renderCalendar();
    updateCharts();
});
yearSelect.addEventListener('change', function() {
    currentDate.setFullYear(parseInt(yearSelect.value));
    renderCalendar();
    updateCharts();
});

/**
 * Initialize charts if Chart.js is available
 */
function initializeCharts() {
    // Check if Chart.js is available (may be blocked by CSP)
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available - charts will be disabled');
        // Show fallback message
        const chartsUnavailable = document.getElementById('chartsUnavailable');
        if (chartsUnavailable) {
            chartsUnavailable.style.display = 'block';
        }
        // Hide chart elements
        const chartElements = document.querySelectorAll('.trend-chart');
        chartElements.forEach(element => {
            element.style.display = 'none';
        });
        return;
    }
    
    try {
        createMoodTrendsChart();
        createTagFrequencyChart();
        setupTrendsEventListeners();
    } catch (error) {
        console.error('Error initializing charts:', error);
        // Show fallback message
        const chartsUnavailable = document.getElementById('chartsUnavailable');
        if (chartsUnavailable) {
            chartsUnavailable.style.display = 'block';
        }
        // Hide chart elements if there's an error
        const chartElements = document.querySelectorAll('.trend-chart');
        chartElements.forEach(element => {
            element.style.display = 'none';
        });
    }
}

/**
 * Create mood trends chart
 */
function createMoodTrendsChart() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available - skipping mood trends chart');
        return;
    }
    
    const ctx = document.getElementById('moodTrendsChart');
    if (!ctx) {
        console.warn('Mood trends chart canvas not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (moodTrendsChart) {
        moodTrendsChart.destroy();
    }
    
    const data = getMoodTrendsData();
    
    moodTrendsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    updateMoodChartLegend(data);
}

/**
 * Create tag frequency chart
 */
function createTagFrequencyChart() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available - skipping tag frequency chart');
        return;
    }
    
    const ctx = document.getElementById('tagFrequencyChart');
    if (!ctx) {
        console.warn('Tag frequency chart canvas not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (tagFrequencyChart) {
        tagFrequencyChart.destroy();
    }
    
    const data = getTagFrequencyData();
    
    tagFrequencyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    updateTagChartLegend(data);
}

/**
 * Get mood trends data for the current month/year
 */
function getMoodTrendsData() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get entries for the current month
    const monthEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
    
    // Count mood frequencies
    const moodCounts = {};
    monthEntries.forEach(entry => {
        if (entry.mood) {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
    });
    
    // Sort by frequency and get top moods
    const sortedMoods = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Show top 8 moods
    
    return {
        labels: sortedMoods.map(([mood]) => getMoodInfo(mood).name),
        values: sortedMoods.map(([, count]) => count),
        colors: sortedMoods.map(([mood]) => moodColors[mood] || chartColors.primary)
    };
}

/**
 * Get tag frequency data
 */
function getTagFrequencyData() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get entries for the current month
    const monthEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
    
    // Count tag frequencies
    const tagCounts = {};
    monthEntries.forEach(entry => {
        if (entry.tags && entry.tags.length > 0) {
            entry.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    // Sort by frequency and get top 5 tags
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    // Generate colors for tags
    const tagColors = [
        chartColors.primary,
        chartColors.secondary,
        chartColors.accent,
        '#ed8936',
        '#9f7aea'
    ];
    
    return {
        labels: sortedTags.map(([tag]) => `#${tag}`),
        values: sortedTags.map(([, count]) => count),
        colors: sortedTags.map((_, index) => tagColors[index] || chartColors.primary)
    };
}

/**
 * Update charts with new data
 */
function updateCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available - skipping chart updates');
        return;
    }
    
    try {
        if (moodTrendsChart) {
            const moodData = getMoodTrendsData();
            moodTrendsChart.data.labels = moodData.labels;
            moodTrendsChart.data.datasets[0].data = moodData.values;
            moodTrendsChart.data.datasets[0].backgroundColor = moodData.colors;
            moodTrendsChart.update();
            updateMoodChartLegend(moodData);
        }
        
        if (tagFrequencyChart) {
            const tagData = getTagFrequencyData();
            tagFrequencyChart.data.labels = tagData.labels;
            tagFrequencyChart.data.datasets[0].data = tagData.values;
            tagFrequencyChart.data.datasets[0].backgroundColor = tagData.colors;
            tagFrequencyChart.update();
            updateTagChartLegend(tagData);
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Privacy Mode logic
function togglePrivacyMode() {
    if (!privacyMode) {
        // Optionally prompt for PIN on enable
        const setPin = confirm('Would you like to set a 4-digit PIN for Privacy Mode?');
        if (setPin) {
            let pin = prompt('Enter a 4-digit PIN:', '');
            if (pin && /^\d{4}$/.test(pin)) {
                privacyPin = pin;
                sessionStorage.setItem('privacyPin', pin);
            } else if (pin !== null) {
                alert('PIN must be exactly 4 digits. Privacy Mode will be enabled without a PIN.');
                privacyPin = null;
                sessionStorage.removeItem('privacyPin');
            }
        } else {
            privacyPin = null;
            sessionStorage.removeItem('privacyPin');
        }
    } else if (privacyPin) {
        // Require PIN to disable
        let entered = prompt('Enter your 4-digit PIN to disable Privacy Mode:','');
        if (entered !== privacyPin) {
            alert('Incorrect PIN. Privacy Mode remains enabled.');
            return;
        }
    }
    privacyMode = !privacyMode;
    sessionStorage.setItem('privacyMode', privacyMode);
    privacyModeToggle.setAttribute('aria-pressed', privacyMode ? 'true' : 'false');
    updatePrivacyModeUI();
}

function updatePrivacyModeUI() {
    if (privacyMode) {
        // Hide entries, show locked message, disable calendar click
        if (entriesContainer) entriesContainer.style.display = 'none';
        if (noEntries) noEntries.style.display = 'none';
        if (privacyLockedMessage) privacyLockedMessage.style.display = 'block';
        // Disable calendar click
        if (calendarDaysContainer) {
            Array.from(calendarDaysContainer.children).forEach(day => {
                day.style.pointerEvents = 'none';
                day.style.opacity = 0.5;
            });
        }
    } else {
        if (entriesContainer) entriesContainer.style.display = '';
        if (noEntries) noEntries.style.display = '';
        if (privacyLockedMessage) privacyLockedMessage.style.display = 'none';
        // Enable calendar click
        if (calendarDaysContainer) {
            Array.from(calendarDaysContainer.children).forEach(day => {
                day.style.pointerEvents = '';
                day.style.opacity = '';
            });
        }
    }
}

/**
 * Setup trends event listeners
 */
function setupTrendsEventListeners() {
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', handleDateRangeChange);
    }
    if (comparisonToggle) {
        comparisonToggle.addEventListener('change', handleComparisonToggle);
    }
    if (startDate) {
        startDate.addEventListener('change', handleCustomDateChange);
    }
    if (endDate) {
        endDate.addEventListener('change', handleCustomDateChange);
    }
}

/**
 * Handle date range selection change
 */
function handleDateRangeChange() {
    currentDateRange = dateRangeSelect.value;
    
    if (currentDateRange === 'custom') {
        customDateRange.style.display = 'flex';
        // Set default custom range to last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        startDate.value = start.toISOString().split('T')[0];
        endDate.value = end.toISOString().split('T')[0];
        customStartDate = start;
        customEndDate = end;
    } else {
        customDateRange.style.display = 'none';
        customStartDate = null;
        customEndDate = null;
    }
    
    updateCharts();
}

/**
 * Handle comparison toggle
 */
function handleComparisonToggle() {
    comparisonEnabled = comparisonToggle.checked;
    updateCharts();
}

/**
 * Handle custom date change
 */
function handleCustomDateChange() {
    if (startDate.value && endDate.value) {
        customStartDate = new Date(startDate.value);
        customEndDate = new Date(endDate.value);
        updateCharts();
    }
}

/**
 * Get date range based on selection
 */
function getDateRange() {
    const now = new Date();
    let start, end;
    
    switch (currentDateRange) {
        case '7':
            end = new Date(now);
            start = new Date(now);
            start.setDate(start.getDate() - 7);
            break;
        case '30':
            end = new Date(now);
            start = new Date(now);
            start.setDate(start.getDate() - 30);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'lastMonth':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            break;
        case 'custom':
            start = customStartDate;
            end = customEndDate;
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    return { start, end };
}

/**
 * Get comparison date range
 */
function getComparisonDateRange() {
    const { start, end } = getDateRange();
    const duration = end.getTime() - start.getTime();
    
    const comparisonEnd = new Date(start.getTime() - 1);
    const comparisonStart = new Date(comparisonEnd.getTime() - duration);
    
    return { start: comparisonStart, end: comparisonEnd };
}

/**
 * Filter entries by date range
 */
function filterEntriesByDateRange(start, end) {
    return journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
    });
}

/**
 * Calculate trend percentage
 */
function calculateTrendPercentage(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get trend indicator
 */
function getTrendIndicator(percentage) {
    if (percentage > 0) {
        return `<span class="trend-indicator trend-up">📈 +${percentage}%</span>`;
    } else if (percentage < 0) {
        return `<span class="trend-indicator trend-down">📉 ${percentage}%</span>`;
    } else {
        return `<span class="trend-indicator trend-neutral">➡️ 0%</span>`;
    }
}

/**
 * Create mood trends chart with comparison
 */
function createMoodTrendsChart() {
    const ctx = document.getElementById('moodTrendsChart');
    if (!ctx) return;
    
    if (moodTrendsChart) {
        moodTrendsChart.destroy();
    }
    
    const data = getMoodTrendsData();
    
    const datasets = [{
        label: 'Current Period',
        data: data.values,
        backgroundColor: data.colors,
        borderColor: chartColors.border,
        borderWidth: 1,
        borderRadius: 4
    }];
    
    if (comparisonEnabled && data.comparisonValues) {
        datasets.push({
            label: 'Previous Period',
            data: data.comparisonValues,
            backgroundColor: data.comparisonColors,
            borderColor: chartColors.border,
            borderWidth: 1,
            borderRadius: 4,
            opacity: 0.7
        });
    }
    
    moodTrendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: comparisonEnabled,
                    position: 'top',
                    labels: {
                        color: chartColors.text,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    callbacks: {
                        afterBody: function(context) {
                            if (comparisonEnabled && data.trends) {
                                const index = context[0].dataIndex;
                                const trend = data.trends[index];
                                if (trend) {
                                    return [`${trend}`];
                                }
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: chartColors.text
                    },
                    grid: {
                        color: chartColors.border
                    }
                },
                x: {
                    ticks: {
                        color: chartColors.text
                    },
                    grid: {
                        color: chartColors.border
                    }
                }
            }
        }
    });
    
    updateMoodChartLegend(data);
}

/**
 * Create tag frequency chart with comparison
 */
function createTagFrequencyChart() {
    const ctx = document.getElementById('tagFrequencyChart');
    if (!ctx) return;
    
    if (tagFrequencyChart) {
        tagFrequencyChart.destroy();
    }
    
    const data = getTagFrequencyData();
    
    tagFrequencyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartColors.text,
                        padding: 15,
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const trend = comparisonEnabled && data.trends ? data.trends[i] : '';
                                    return {
                                        text: `${label}: ${value}${trend}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        lineWidth: 0,
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    callbacks: {
                        afterBody: function(context) {
                            if (comparisonEnabled && data.trends) {
                                const index = context[0].dataIndex;
                                const trend = data.trends[index];
                                if (trend) {
                                    return [`${trend}`];
                                }
                            }
                            return [];
                        }
                    }
                }
            }
        }
    });
    
    updateTagChartLegend(data);
}

/**
 * Get enhanced mood trends data with comparison
 */
function getMoodTrendsData() {
    const { start, end } = getDateRange();
    const currentEntries = filterEntriesByDateRange(start, end);
    
    // Count current mood frequencies
    const moodCounts = {};
    currentEntries.forEach(entry => {
        if (entry.mood) {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
    });
    
    // Sort by frequency and get top moods
    const sortedMoods = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
    
    const result = {
        labels: sortedMoods.map(([mood]) => getMoodInfo(mood).name),
        values: sortedMoods.map(([, count]) => count),
        colors: sortedMoods.map(([mood]) => moodColors[mood] || chartColors.primary),
        comparisonValues: null,
        comparisonColors: null,
        trends: null
    };
    
    // Add comparison data if enabled
    if (comparisonEnabled) {
        const { start: compStart, end: compEnd } = getComparisonDateRange();
        const comparisonEntries = filterEntriesByDateRange(compStart, compEnd);
        
        const comparisonCounts = {};
        comparisonEntries.forEach(entry => {
            if (entry.mood) {
                comparisonCounts[entry.mood] = (comparisonCounts[entry.mood] || 0) + 1;
            }
        });
        
        result.comparisonValues = sortedMoods.map(([mood]) => comparisonCounts[mood] || 0);
        result.comparisonColors = sortedMoods.map(([mood]) => {
            const color = moodColors[mood] || chartColors.primary;
            return color + '80'; // Add transparency
        });
        
        // Calculate trends
        result.trends = sortedMoods.map(([mood, currentCount]) => {
            const previousCount = comparisonCounts[mood] || 0;
            const percentage = calculateTrendPercentage(currentCount, previousCount);
            return getTrendIndicator(percentage);
        });
    }
    
    return result;
}

/**
 * Get enhanced tag frequency data with comparison
 */
function getTagFrequencyData() {
    const { start, end } = getDateRange();
    const currentEntries = filterEntriesByDateRange(start, end);
    
    // Count current tag frequencies
    const tagCounts = {};
    currentEntries.forEach(entry => {
        if (entry.tags && entry.tags.length > 0) {
            entry.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    // Sort by frequency and get top 5 tags
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const tagColors = [
        chartColors.primary,
        chartColors.secondary,
        chartColors.accent,
        '#ed8936',
        '#9f7aea'
    ];
    
    const result = {
        labels: sortedTags.map(([tag]) => `#${tag}`),
        values: sortedTags.map(([, count]) => count),
        colors: sortedTags.map((_, index) => tagColors[index] || chartColors.primary),
        trends: null
    };
    
    // Add comparison data if enabled
    if (comparisonEnabled) {
        const { start: compStart, end: compEnd } = getComparisonDateRange();
        const comparisonEntries = filterEntriesByDateRange(compStart, compEnd);
        
        const comparisonCounts = {};
        comparisonEntries.forEach(entry => {
            if (entry.tags && entry.tags.length > 0) {
                entry.tags.forEach(tag => {
                    comparisonCounts[tag] = (comparisonCounts[tag] || 0) + 1;
                });
            }
        });
        
        // Calculate trends
        result.trends = sortedTags.map(([tag, currentCount]) => {
            const previousCount = comparisonCounts[tag] || 0;
            const percentage = calculateTrendPercentage(currentCount, previousCount);
            return getTrendIndicator(percentage);
        });
    }
    
    return result;
}

/**
 * Update mood chart legend
 */
function updateMoodChartLegend(data) {
    if (!moodChartLegend) return;
    
    let legendHtml = '';
    if (comparisonEnabled) {
        legendHtml = `
            <div class="legend-item">
                <div class="legend-color" style="background: ${chartColors.primary}"></div>
                <span class="legend-label">Current Period</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: ${chartColors.primary}80"></div>
                <span class="legend-label">Previous Period</span>
            </div>
        `;
    }
    
    moodChartLegend.innerHTML = legendHtml;
}

/**
 * Update tag chart legend
 */
function updateTagChartLegend(data) {
    if (!tagChartLegend) return;
    
    let legendHtml = '';
    if (comparisonEnabled && data.trends) {
        legendHtml = '<div class="legend-item"><span class="legend-label">Trends:</span></div>';
        data.trends.forEach(trend => {
            legendHtml += `<div class="legend-item">${trend}</div>`;
        });
    }
    
    tagChartLegend.innerHTML = legendHtml;
}

// Function to get user-specific storage key
function getStorageKey() {
    const key = currentUser ? `journalEntries_${currentUser.id}` : 'journalEntries';
    console.log('getStorageKey called, currentUser:', currentUser ? currentUser.email : 'null');
    console.log('Storage key:', key);
    return key;
}

/**
 * Generate encryption key from user password
 */
async function generateEncryptionKey(password) {
    try {
        // Use the same hashing method as password, but with a different salt
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'journal_encryption_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    } catch (error) {
        console.error('Error generating encryption key:', error);
        return null;
    }
}

/**
 * Set encryption key for current user
 */
async function setUserEncryptionKey(password) {
    userEncryptionKey = await generateEncryptionKey(password);
}

/**
 * Simple encryption function for journal entries
 */
function encryptText(text) {
    if (!text || !userEncryptionKey) return text;
    try {
        // Simple XOR encryption with the user's key
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ userEncryptionKey.charCodeAt(i % userEncryptionKey.length);
            encrypted += String.fromCharCode(charCode);
        }
        return btoa(encrypted); // Base64 encode
    } catch (error) {
        console.error('Encryption error:', error);
        return text; // Fallback to plain text
    }
}

/**
 * Simple decryption function for journal entries
 */
function decryptText(encryptedText) {
    if (!encryptedText || !userEncryptionKey) return encryptedText;
    try {
        // Base64 decode first
        const decoded = atob(encryptedText);
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ userEncryptionKey.charCodeAt(i % userEncryptionKey.length);
            decrypted += String.fromCharCode(charCode);
        }
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText; // Fallback to encrypted text
    }
}

/**
 * Setup password management event listeners
 */
function setupPasswordManagementEventListeners() {
    // Forgot password
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordModal();
    });
    
    closeForgotPasswordModal.addEventListener('click', hideForgotPasswordModal);
    resetPasswordForm.addEventListener('submit', handleResetPassword);
    
    // Change password
    changePasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showChangePasswordModal();
    });
    
    closeChangePasswordModal.addEventListener('click', hideChangePasswordModal);
    changePasswordForm.addEventListener('submit', handleChangePassword);
    
    // Close modals when clicking outside
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            hideForgotPasswordModal();
        }
    });
    
    changePasswordModal.addEventListener('click', (e) => {
        if (e.target === changePasswordModal) {
            hideChangePasswordModal();
        }
    });
}

/**
 * Show forgot password modal
 */
function showForgotPasswordModal() {
    forgotPasswordModal.style.display = 'flex';
    document.getElementById('resetPasswordError').textContent = '';
    resetPasswordForm.reset();
}

/**
 * Hide forgot password modal
 */
function hideForgotPasswordModal() {
    forgotPasswordModal.style.display = 'none';
}

/**
 * Show change password modal
 */
function showChangePasswordModal() {
    changePasswordModal.style.display = 'flex';
    document.getElementById('changePasswordError').textContent = '';
    changePasswordForm.reset();
}

/**
 * Hide change password modal
 */
function hideChangePasswordModal() {
    changePasswordModal.style.display = 'none';
}

/**
 * Handle reset password form submission
 */
async function handleResetPassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const errorElement = document.getElementById('resetPasswordError');
    
    // Clear previous errors
    errorElement.textContent = '';
    
    // Validation
    if (!currentPassword) {
        errorElement.textContent = 'Please enter your current password.';
        return;
    }
    
    if (!isValidPassword(newPassword)) {
        errorElement.textContent = 'New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.';
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        errorElement.textContent = 'New passwords do not match.';
        return;
    }
    
    try {
        // Verify current password
        const hashedCurrentPassword = await hashPassword(currentPassword);
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.password === hashedCurrentPassword);
        
        if (!user) {
            errorElement.textContent = 'Current password is incorrect.';
            return;
        }
        
        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);
        
        // Update user password
        user.password = hashedNewPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if logged in
        if (currentUser && currentUser.id === user.id) {
            currentUser = { id: user.id, email: user.email };
            // Update encryption key with new password
            await setUserEncryptionKey(newPassword);
        }
        
        hideForgotPasswordModal();
        showSuccessMessage('Password reset successfully!');
        
    } catch (error) {
        console.error('Error resetting password:', error);
        errorElement.textContent = 'An error occurred while resetting your password. Please try again.';
    }
}

/**
 * Handle change password form submission
 */
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('changeCurrentPassword').value;
    const newPassword = document.getElementById('changeNewPassword').value;
    const confirmNewPassword = document.getElementById('changeConfirmPassword').value;
    const errorElement = document.getElementById('changePasswordError');
    
    // Clear previous errors
    errorElement.textContent = '';
    
    // Validation
    if (!currentPassword) {
        errorElement.textContent = 'Please enter your current password.';
        return;
    }
    
    if (!isValidPassword(newPassword)) {
        errorElement.textContent = 'New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.';
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        errorElement.textContent = 'New passwords do not match.';
        return;
    }
    
    try {
        // Verify current password
        const hashedCurrentPassword = await hashPassword(currentPassword);
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.password === hashedCurrentPassword);
        
        if (!user) {
            errorElement.textContent = 'Current password is incorrect.';
            return;
        }
        
        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);
        
        // Update user password
        user.password = hashedNewPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if logged in
        if (currentUser && currentUser.id === user.id) {
            currentUser = { id: user.id, email: user.email };
            // Update encryption key with new password
            await setUserEncryptionKey(newPassword);
        }
        
        hideChangePasswordModal();
        showSuccessMessage('Password changed successfully!');
        
    } catch (error) {
        console.error('Error changing password:', error);
        errorElement.textContent = 'An error occurred while changing your password. Please try again.';
    }
}

/**
 * Setup test user creation event listeners
 */
function setupTestUserEventListeners() {
    testUserForm.addEventListener('submit', handleTestUserCreation);
}

/**
 * Handle test user creation
 */
async function handleTestUserCreation(event) {
    event.preventDefault();
    
    const email = sanitizeInput(testUserEmail.value);
    const password = testUserPassword.value;
    
    // Clear previous errors
    testUserError.textContent = '';
    
    // Validation
    if (!isValidEmail(email)) {
        testUserError.textContent = 'Please enter a valid email address.';
        return;
    }
    
    if (!isValidPassword(password)) {
        testUserError.textContent = 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.';
        return;
    }
    
    try {
        // Hash the password
        const hashedPassword = await hashPassword(password);
        
        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (existingUsers.find(user => user.email === email)) {
            testUserError.textContent = 'A user with this email already exists.';
            return;
        }
        
        // Create test user
        const testUser = {
            id: Date.now(),
            email: email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            isTestUser: true // Mark as test user
        };
        
        // Add to existing users
        existingUsers.push(testUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Clear form
        testUserForm.reset();
        
        // Show success message
        testUserError.style.color = '#48bb78';
        testUserError.textContent = `Test user created successfully! Email: ${email}`;
        
        // Clear success message after 5 seconds
        setTimeout(() => {
            testUserError.textContent = '';
            testUserError.style.color = '#e53e3e';
        }, 5000);
        
    } catch (error) {
        console.error('Error creating test user:', error);
        testUserError.textContent = 'An error occurred while creating the test user. Please try again.';
    }
}

/**
 * Display existing test users
 */
function displayTestUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const testUsers = users.filter(user => user.isTestUser);
        
        if (testUsers.length === 0) {
            console.log('No test users found');
            return;
        }
        
        console.log('Existing test users:');
        testUsers.forEach(user => {
            console.log(`- Email: ${user.email} (ID: ${user.id})`);
        });
    } catch (error) {
        console.error('Error displaying test users:', error);
    }
}

/**
 * Clear all test users (for cleanup)
 */
function clearTestUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const nonTestUsers = users.filter(user => !user.isTestUser);
        localStorage.setItem('users', JSON.stringify(nonTestUsers));
        console.log('All test users cleared');
    } catch (error) {
        console.error('Error clearing test users:', error);
    }
} 
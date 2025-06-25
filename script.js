// Enhanced Journal App JavaScript

// Authentication state
let currentUser = null;
let isAuthenticated = false;

// DOM elements for authentication
const authOverlay = document.getElementById('authOverlay');
const mainApp = document.getElementById('mainApp');
const signUpForm = document.getElementById('signUpForm');
const loginForm = document.getElementById('loginForm');
const signUpEmail = document.getElementById('signUpEmail');
const signUpPassword = document.getElementById('signUpPassword');
const confirmPassword = document.getElementById('confirmPassword');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signUpError = document.getElementById('signUpError');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';
let selectedMood = '';
let selectedTags = [];
let currentDate = new Date();
let selectedCalendarDate = null;
let calendarDayElements = [];
const privacyModeToggle = document.getElementById('privacyModeToggle');
const privacyLockedMessage = document.getElementById('privacyLockedMessage');
let privacyMode = sessionStorage.getItem('privacyMode') === 'true';
let privacyPin = sessionStorage.getItem('privacyPin') || null;

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

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
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
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAuthenticated = true;
            showMainApp();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            logout();
        }
    } else {
        showAuthOverlay();
    }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
    signUpForm.addEventListener('submit', handleSignUp);
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', logout);
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
    }
    
    // Initialize app features
    loadEntries();
    renderCalendar();
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
        toggle.textContent = '👁️';
    }
}

/**
 * Switch between sign up and login views
 */
function switchAuthView(view) {
    if (view === 'login') {
        signUpForm.style.display = 'none';
        loginForm.style.display = 'block';
        clearAuthErrors();
    } else {
        loginForm.style.display = 'none';
        signUpForm.style.display = 'block';
        clearAuthErrors();
    }
}

/**
 * Clear authentication error messages
 */
function clearAuthErrors() {
    signUpError.textContent = '';
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
 * Validate password strength
 */
function isValidPassword(password) {
    return password.length >= 6;
}

/**
 * Handle sign up form submission
 */
function handleSignUp(event) {
    event.preventDefault();
    clearAuthErrors();
    
    const email = signUpEmail.value.trim();
    const password = signUpPassword.value;
    const confirm = confirmPassword.value;
    
    // Validation
    if (!isValidEmail(email)) {
        signUpError.textContent = 'Please enter a valid email address.';
        return;
    }
    
    if (!isValidPassword(password)) {
        signUpError.textContent = 'Password must be at least 6 characters long.';
        return;
    }
    
    if (password !== confirm) {
        signUpError.textContent = 'Passwords do not match.';
        return;
    }
    
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find(user => user.email === email)) {
        signUpError.textContent = 'An account with this email already exists.';
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        email: email,
        password: password, // In a real app, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    // Save user
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Log in the new user
    currentUser = { id: newUser.id, email: newUser.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    isAuthenticated = true;
    
    showMainApp();
    showSuccessMessage('Account created successfully!');
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
    event.preventDefault();
    clearAuthErrors();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    // Validation
    if (!isValidEmail(email)) {
        loginError.textContent = 'Please enter a valid email address.';
        return;
    }
    
    if (!password) {
        loginError.textContent = 'Please enter your password.';
        return;
    }
    
    // Check credentials
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        loginError.textContent = 'Invalid email or password.';
        return;
    }
    
    // Log in user
    currentUser = { id: user.id, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    isAuthenticated = true;
    
    showMainApp();
    showSuccessMessage('Welcome back!');
}

/**
 * Handle logout
 */
function logout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('privacyMode');
    sessionStorage.removeItem('privacyPin');
    
    showAuthOverlay();
    
    // Clear forms
    signUpForm.reset();
    loginForm.reset();
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
    
    const text = entryText.value.trim();
    const mood = selectedMood;
    
    if (!text) {
        alert('Please write something in your journal entry!');
        return;
    }
    if (!mood) {
        alert('Please select your mood!');
        return;
    }
    
    const newEntry = {
        id: Date.now(),
        text: text,
        mood: mood,
        tags: [...selectedTags], // Copy the array
        date: new Date().toISOString(),
        dateString: new Date().toISOString().split('T')[0]
    };
    
    journalEntries.unshift(newEntry);
    saveEntries();
    
    renderCalendar();
    filterEntries(); 
    updateCharts();
    
    showSuccessMessage('Journal entry saved successfully!');
    
    // Reset form
    journalForm.reset();
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = '';
    selectedMoodInput.value = '';
    selectedTags = [];
    updateSelectedTagsDisplay();
    updateSelectedTagsInput();
    tagButtons.forEach(btn => btn.classList.remove('selected'));
}

/**
 * Saves entries to localStorage
 */
function saveEntries() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journalEntries));
    } catch (error) {
        console.error('Error saving entries to localStorage:', error);
    }
}

/**
 * Loads entries from localStorage
 */
function loadEntries() {
    try {
        const savedEntries = localStorage.getItem(STORAGE_KEY);
        if (savedEntries) {
            journalEntries = JSON.parse(savedEntries).map(entry => {
                if (!entry.dateString) {
                    entry.dateString = new Date(entry.date).toISOString().split('T')[0];
                }
                // Ensure tags exist for older entries
                if (!entry.tags) {
                    entry.tags = [];
                }
                return entry;
            });
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
    if(!entriesContainer) return;
    entriesContainer.innerHTML = '';

    if (entries.length === 0) {
        if(noEntries) noEntries.style.display = 'block';
        let message = 'No journal entries yet. Start writing!';
        if (selectedCalendarDate) {
            message = `No entries for ${formatDate(selectedCalendarDate)}.`;
        } else if (searchInput.value || document.querySelector('.filter-btn.active:not([data-mood=""])')) {
            message = 'No entries match your search or filter.';
        }
        if(noEntries) noEntries.querySelector('p').textContent = message;
    } else {
        if(noEntries) noEntries.style.display = 'none';
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
 * Initialize charts
 */
function initializeCharts() {
    createMoodTrendsChart();
    createTagFrequencyChart();
}

/**
 * Create mood trends chart
 */
function createMoodTrendsChart() {
    const ctx = document.getElementById('moodTrendsChart');
    if (!ctx) return;
    
    if (moodTrendsChart) {
        moodTrendsChart.destroy();
    }
    
    const data = getMoodTrendsData();
    
    moodTrendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Mood Frequency',
                data: data.values,
                backgroundColor: data.colors,
                borderColor: chartColors.border,
                borderWidth: 1,
                borderRadius: 4
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
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartColors.primary,
                    borderWidth: 1
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
}

/**
 * Create tag frequency chart
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
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartColors.primary,
                    borderWidth: 1
                }
            }
        }
    });
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
 * Update charts with current data
 */
function updateCharts() {
    if (moodTrendsChart) {
        const moodData = getMoodTrendsData();
        moodTrendsChart.data.labels = moodData.labels;
        moodTrendsChart.data.datasets[0].data = moodData.values;
        moodTrendsChart.data.datasets[0].backgroundColor = moodData.colors;
        moodTrendsChart.update();
    }
    
    if (tagFrequencyChart) {
        const tagData = getTagFrequencyData();
        tagFrequencyChart.data.labels = tagData.labels;
        tagFrequencyChart.data.datasets[0].data = tagData.values;
        tagFrequencyChart.data.datasets[0].backgroundColor = tagData.colors;
        tagFrequencyChart.update();
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
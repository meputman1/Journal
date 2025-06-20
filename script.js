// Enhanced Journal App JavaScript
// This file contains all the logic for the journaling application with calendar view

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';
let selectedMood = '';
let currentDate = new Date();
let selectedCalendarDate = null;

// DOM elements
const journalForm = document.getElementById('journalForm');
const entryText = document.getElementById('entryText');
const selectedMoodInput = document.getElementById('selectedMood');
const entriesContainer = document.getElementById('entriesContainer');
const noEntries = document.getElementById('noEntries');
const searchInput = document.getElementById('searchInput');
const moodButtons = document.querySelectorAll('.mood-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

// Calendar elements
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthDisplay = document.getElementById('currentMonth');
const calendarDaysContainer = document.getElementById('calendarDays');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEntries();
    setupEventListeners();
    renderCalendar();
    displayEntries();
});

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Form submission for new entries
    journalForm.addEventListener('submit', handleFormSubmit);
    
    // Mood button selection
    moodButtons.forEach(button => {
        button.addEventListener('click', handleMoodSelection);
    });
    
    // Filter button selection
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterSelection);
    });
    
    // Search functionality
    searchInput.addEventListener('input', filterEntries);
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
}

/**
 * Handles mood button selection in the form
 * @param {Event} event - The click event
 */
function handleMoodSelection(event) {
    const clickedButton = event.target;
    const mood = clickedButton.dataset.mood;
    
    // Remove selected class from all mood buttons
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Add selected class to clicked button
    clickedButton.classList.add('selected');
    
    // Update the hidden input and global variable
    selectedMood = mood;
    selectedMoodInput.value = mood;
}

/**
 * Handles filter button selection
 * @param {Event} event - The click event
 */
function handleFilterSelection(event) {
    const clickedButton = event.target;
    const mood = clickedButton.dataset.mood;
    
    // Remove active class from all filter buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    clickedButton.classList.add('active');
    
    // Filter entries
    filterEntries();
}

/**
 * Handles the form submission when user saves a new entry
 * @param {Event} event - The form submission event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const text = entryText.value.trim();
    const mood = selectedMood;
    
    // Validate that text is not empty
    if (!text) {
        alert('Please write something in your journal entry!');
        return;
    }
    
    // Create new entry object with enhanced structure
    const newEntry = {
        id: Date.now(), // Use timestamp as unique ID
        text: text,
        mood: mood,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        dateString: new Date().toISOString().split('T')[0] // YYYY-MM-DD format for easy filtering
    };
    
    // Add entry to array and save
    journalEntries.unshift(newEntry); // Add to beginning of array
    saveEntries();
    
    // Update UI
    renderCalendar();
    displayEntries();
    
    // Show success message
    showSuccessMessage('Journal entry saved successfully!');
    
    // Reset form
    journalForm.reset();
    
    // Reset mood selection
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = '';
    selectedMoodInput.value = '';
}

/**
 * Saves journal entries to localStorage
 */
function saveEntries() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journalEntries));
    } catch (error) {
        console.error('Error saving entries to localStorage:', error);
        alert('There was an error saving your entry. Please try again.');
    }
}

/**
 * Loads journal entries from localStorage
 */
function loadEntries() {
    try {
        const savedEntries = localStorage.getItem(STORAGE_KEY);
        if (savedEntries) {
            journalEntries = JSON.parse(savedEntries);
            
            // Ensure all entries have the dateString property for backward compatibility
            journalEntries.forEach(entry => {
                if (!entry.dateString) {
                    entry.dateString = new Date(entry.date).toISOString().split('T')[0];
                }
            });
        }
    } catch (error) {
        console.error('Error loading entries from localStorage:', error);
        journalEntries = [];
    }
}

/**
 * Renders the calendar for the current month
 */
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Clear calendar
    calendarDaysContainer.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Create date string for comparison
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if this date has entries
        const hasEntries = journalEntries.some(entry => entry.dateString === dateString);
        if (hasEntries) {
            dayElement.classList.add('has-entries');
        }
        
        // Check if this is today
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Check if this is the selected date
        if (selectedCalendarDate && selectedCalendarDate === dateString) {
            dayElement.classList.add('selected');
        }
        
        // Add click event
        dayElement.addEventListener('click', () => selectCalendarDate(dateString));
        
        calendarDaysContainer.appendChild(dayElement);
    }
}

/**
 * Navigates to previous or next month
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    selectedCalendarDate = null; // Reset selected date when changing months
    renderCalendar();
    filterEntries(); // Re-apply current filters
}

/**
 * Selects a date in the calendar and filters entries
 * @param {string} dateString - Date in YYYY-MM-DD format
 */
function selectCalendarDate(dateString) {
    selectedCalendarDate = selectedCalendarDate === dateString ? null : dateString;
    renderCalendar();
    filterEntries();
}

/**
 * Displays all journal entries in the UI
 * @param {Array} entriesToShow - Optional array of entries to display (for filtering)
 */
function displayEntries(entriesToShow = journalEntries) {
    // Clear current entries
    entriesContainer.innerHTML = '';
    
    // Show/hide no entries message
    if (entriesToShow.length === 0) {
        noEntries.style.display = 'block';
        entriesContainer.style.display = 'none';
        return;
    } else {
        noEntries.style.display = 'none';
        entriesContainer.style.display = 'block';
    }
    
    // Create and append entry cards
    entriesToShow.forEach(entry => {
        const entryCard = createEntryCard(entry);
        entriesContainer.appendChild(entryCard);
    });
}

/**
 * Creates an HTML element for a single journal entry
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
 * @param {Object} entry - The journal entry object
 * @returns {HTMLElement} The entry card element
=======
 * @param {object} entry - The journal entry object
 * @returns {HTMLElement} - The entry card element
>>>>>>> Stashed changes
=======
 * @param {object} entry - The journal entry object
 * @returns {HTMLElement} - The entry card element
>>>>>>> Stashed changes
=======
 * @param {object} entry - The journal entry object
 * @returns {HTMLElement} - The entry card element
>>>>>>> Stashed changes
 */
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    
    // Format the date
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get mood emoji and text
=======
    card.dataset.mood = entry.mood; // Add data-mood attribute for styling

>>>>>>> Stashed changes
=======
    card.dataset.mood = entry.mood; // Add data-mood attribute for styling

>>>>>>> Stashed changes
=======
    card.dataset.mood = entry.mood; // Add data-mood attribute for styling

>>>>>>> Stashed changes
    const moodInfo = getMoodInfo(entry.mood);
    
    card.innerHTML = `
        <div class="entry-header">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            <span class="entry-date">${formattedDate}</span>
            ${entry.mood ? `<span class="entry-mood">${moodInfo.emoji} ${moodInfo.text}</span>` : ''}
        </div>
        <div class="entry-text">${entry.text}</div>
    `;
    
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-mood" title="${moodInfo.label}">${moodInfo.emoji}</span>
        </div>
        <p class="entry-text">${entry.text}</p>
        <div class="entry-footer">
            <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </div>
    `;

    // Add event listener for the delete button
    card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteEntry(entry.id);
    });

<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    return card;
}

/**
 * Returns mood information based on mood value
 * @param {string} mood - The mood value
 * @returns {Object} Object containing emoji and text for the mood
 */
function getMoodInfo(mood) {
    const moodMap = {
        'happy': { emoji: '😊', text: 'Happy' },
        'sad': { emoji: '😢', text: 'Sad' },
        'excited': { emoji: '🤩', text: 'Excited' },
        'calm': { emoji: '😌', text: 'Calm' },
        'anxious': { emoji: '😰', text: 'Anxious' },
        'grateful': { emoji: '🙏', text: 'Grateful' },
        'neutral': { emoji: '😐', text: 'Neutral' }
    };
    
    return moodMap[mood] || { emoji: '😐', text: 'Unknown' };
}

/**
 * Enhanced filtering function that combines search, mood filter, and calendar selection
 */
function filterEntries() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeFilterButton = document.querySelector('.filter-btn.active');
    const selectedMood = activeFilterButton ? activeFilterButton.dataset.mood : '';
    
    let filteredEntries = journalEntries;
    
    // Filter by calendar date selection
    if (selectedCalendarDate) {
        filteredEntries = filteredEntries.filter(entry => 
            entry.dateString === selectedCalendarDate
        );
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredEntries = filteredEntries.filter(entry => 
            entry.text.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by mood
    if (selectedMood) {
        filteredEntries = filteredEntries.filter(entry => 
            entry.mood === selectedMood
        );
    }
    
    // Display filtered entries
    displayEntries(filteredEntries);
}

/**
 * Shows a success message when an entry is saved
 * @param {string} message - The success message to display
 */
function showSuccessMessage(message) {
    // Remove any existing success message
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert after the form
    const entryForm = document.querySelector('.entry-form');
    entryForm.parentNode.insertBefore(successDiv, entryForm.nextSibling);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

/**
 * Utility function to format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Gets entries for a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Array} Array of entries for that date
 */
function getEntriesForDate(dateString) {
    return journalEntries.filter(entry => entry.dateString === dateString);
}

/**
 * Gets all unique dates that have entries
 * @returns {Array} Array of date strings
 */
function getDatesWithEntries() {
    return [...new Set(journalEntries.map(entry => entry.dateString))];
}

/**
 * Utility function to clear all entries (for debugging/testing)
 * Uncomment the line below to add a clear button to the UI
 */
// function clearAllEntries() {
//     if (confirm('Are you sure you want to delete all journal entries? This cannot be undone.')) {
//         journalEntries = [];
//         saveEntries();
//         renderCalendar();
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
        formatDate,
        renderCalendar,
        getEntriesForDate,
        getDatesWithEntries
    };
} 
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
    
    // Validate that text is not empty and mood is selected
    if (!text) {
        alert('Please write something in your journal entry!');
        return;
    }
    if (!mood) {
        alert('Please select your mood!');
        return;
    }
    
    // Create new entry object
    const newEntry = {
        id: Date.now(),
        text: text,
        mood: mood,
        date: new Date().toISOString(),
        dateString: new Date().toISOString().split('T')[0]
    };
    
    // Add entry to array and save
    journalEntries.unshift(newEntry);
    saveEntries();
    
    // Update UI
    renderCalendar();
    displayEntries();
    
    // Show success message
    showSuccessMessage('Journal entry saved successfully!');
    
    // Reset form
    journalForm.reset();
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
    currentMonthDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    // Get calendar grid info
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Clear calendar
    calendarDaysContainer.innerHTML = '';
    
    // 1. Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
    }
    
    // 2. Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Add classes for styling
        if (journalEntries.some(entry => entry.dateString === dateString)) {
            dayElement.classList.add('has-entries');
        }
        
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        if (selectedCalendarDate === dateString) {
            dayElement.classList.add('selected');
        }
        
        dayElement.addEventListener('click', () => selectCalendarDate(dateString));
        calendarDaysContainer.appendChild(dayElement);
    }

    // 3. Add empty cells to fill the end of the grid (for consistent 6-week layout)
    const totalCells = 42; // 6 weeks * 7 days
    const cellsRendered = calendarDaysContainer.children.length;
    const remainingCells = totalCells - cellsRendered;

    for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
    }
}

/**
 * Navigates to the previous or next month
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
 * @param {string} dateString - The date to select (YYYY-MM-DD)
 */
function selectCalendarDate(dateString) {
    // If the clicked date is already selected, deselect it
    if (selectedCalendarDate === dateString) {
        selectedCalendarDate = null;
    } else {
        selectedCalendarDate = dateString;
    }
    
    // Re-render calendar and filter entries
    renderCalendar();
    filterEntries();
}

/**
 * Displays journal entries in the UI
 * @param {Array} entriesToShow - Optional array of entries to display (for filtering)
 */
function displayEntries(entriesToShow = journalEntries) {
    entriesContainer.innerHTML = '';

    if (entriesToShow.length === 0) {
        noEntries.style.display = 'block';
        if (selectedCalendarDate) {
            noEntries.querySelector('p').textContent = `No entries for ${formatDate(selectedCalendarDate)}.`;
        } else if (searchInput.value) {
            noEntries.querySelector('p').textContent = 'No entries match your search.';
        } else {
            noEntries.querySelector('p').textContent = 'No journal entries yet. Start writing!';
        }
    } else {
        noEntries.style.display = 'none';
        entriesToShow.forEach(entry => {
            const entryCard = createEntryCard(entry);
            entriesContainer.appendChild(entryCard);
        });
    }
}

/**
 * Creates an HTML element for a single journal entry
 * @param {Object} entry - The journal entry object
 * @returns {HTMLElement} The entry card element
 */
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    
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
    const moodInfo = getMoodInfo(entry.mood);
    
    card.innerHTML = `
        <div class="entry-header">
            <span class="entry-date">${formattedDate}</span>
            <span class="entry-mood" title="${moodInfo.name}">${moodInfo.emoji}</span>
        </div>
        <div class="entry-text">${entry.text}</div>
        <button class="delete-btn" data-id="${entry.id}">Delete</button>
    `;
    
    // Add event listener to the delete button
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        const entryId = e.target.getAttribute('data-id');
        deleteEntry(entryId);
    });

    return card;
}

/**
 * Returns mood information based on mood value
 * @param {string} mood - The mood value
 * @returns {Object} Object containing emoji and text for the mood
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
        'default': { emoji: '❓', name: 'Unknown' }
    };
    return moods[mood] || moods['default'];
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
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Formats a date string into a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Ensure date is not shifted by local timezone
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
 * Deletes an entry by its ID
 * @param {string} entryId - The ID of the entry to delete
 */
function deleteEntry(entryId) {
    // Confirm with the user
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }

    // Find the index of the entry
    const entryIndex = journalEntries.findIndex(entry => entry.id == entryId);

    if (entryIndex > -1) {
        // Remove the entry from the array
        journalEntries.splice(entryIndex, 1);

        // Save the updated entries array
        saveEntries();

        // Re-render the UI
        renderCalendar();
        filterEntries(); // Use filterEntries to respect current filters

        // Show a success message
        showSuccessMessage('Entry deleted successfully!');
    } else {
        console.error('Could not find entry to delete with ID:', entryId);
    }
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

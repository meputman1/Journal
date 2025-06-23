// Enhanced Journal App JavaScript

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';
let selectedMood = '';
let selectedTags = [];
let currentDate = new Date();
let selectedCalendarDate = null;

// DOM elements
const journalForm = document.getElementById('journalForm');
const entryText = document.getElementById('entryText');
const selectedMoodInput = document.getElementById('selectedMood');
const selectedTagsInput = document.getElementById('selectedTags');
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
    
    searchInput.addEventListener('input', filterEntries);
    
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
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
        // Remove tag if already selected
        selectedTags = selectedTags.filter(t => t !== tag);
        clickedButton.classList.remove('selected');
    } else {
        // Add tag if not selected
        selectedTags.push(tag);
        clickedButton.classList.add('selected');
    }
    
    selectedTagsInput.value = selectedTags.join(',');
}

/**
 * Handles tag filter button selection
 */
function handleTagFilterSelection(event) {
    const clickedButton = event.target.closest('.tag-filter-btn');
    if (!clickedButton) return;
    
    const tag = clickedButton.dataset.tag;
    
    if (clickedButton.classList.contains('active')) {
        // Remove filter if already active
        clickedButton.classList.remove('active');
    } else {
        // Add filter if not active
        clickedButton.classList.add('active');
    }
    
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
        tags: [...selectedTags],
        date: new Date().toISOString(),
        dateString: new Date().toISOString().split('T')[0]
    };
    
    journalEntries.unshift(newEntry);
    saveEntries();
    
    renderCalendar();
    filterEntries(); 
    
    showSuccessMessage('Journal entry saved successfully!');
    
    journalForm.reset();
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    tagButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = '';
    selectedTags = [];
    selectedMoodInput.value = '';
    selectedTagsInput.value = '';
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
                // Ensure all entries have tags array for backward compatibility
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

/**
 * Renders the calendar
 */
function renderCalendar() {
    if (!calendarDaysContainer) {
        console.error("Calendar container not found!");
        return;
    }
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    calendarDaysContainer.innerHTML = '';
    
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
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

    const totalCells = 42;
    const cellsRendered = calendarDaysContainer.children.length;
    if (cellsRendered > totalCells) {
        // This case should ideally not happen with correct logic
        console.error("Error: More than 42 cells rendered in the calendar.");
        return;
    }
    const remainingCells = totalCells - cellsRendered;

    for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
    }
}

/**
 * Navigates the calendar month
 */
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
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
}

/**
 * Creates an entry card element
 */
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    const moodInfo = getMoodInfo(entry.mood);
    
    // Create tags HTML if tags exist
    let tagsHTML = '';
    if (entry.tags && entry.tags.length > 0) {
        const tagLabels = {
            'work': '💼 Work',
            'relationship': '💕 Relationship',
            'friendship': '👥 Friendship',
            'family': '👨‍👩‍👧‍👦 Family',
            'health': '🏥 Health',
            'dreams': '💭 Dreams',
            'finances': '💰 Finances',
            'creativity': '🎨 Creativity',
            'travel': '✈️ Travel',
            'therapy': '🧠 Therapy'
        };
        
        tagsHTML = '<div class="entry-tags">';
        entry.tags.forEach(tag => {
            tagsHTML += `<span class="entry-tag">${tagLabels[tag] || tag}</span>`;
        });
        tagsHTML += '</div>';
    }
    
    card.innerHTML = `
        <div class="entry-header">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-mood" title="${moodInfo.name}">${moodInfo.emoji}</span>
        </div>
        <div class="entry-text">${entry.text.replace(/\n/g, '<br>')}</div>
        ${tagsHTML}
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
        filtered = filtered.filter(entry => entry.text.toLowerCase().includes(searchTerm));
    }
    
    const activeFilterButton = document.querySelector('.filter-btn.active');
    const moodFilter = activeFilterButton ? activeFilterButton.dataset.mood : '';
    if (moodFilter) {
        filtered = filtered.filter(entry => entry.mood === moodFilter);
    }
    
    // Filter by selected tags
    const activeTagFilters = document.querySelectorAll('.tag-filter-btn.active');
    if (activeTagFilters.length > 0) {
        const selectedTagFilters = Array.from(activeTagFilters).map(btn => btn.dataset.tag);
        filtered = filtered.filter(entry => {
            if (!entry.tags || entry.tags.length === 0) return false;
            return selectedTagFilters.some(tag => entry.tags.includes(tag));
        });
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
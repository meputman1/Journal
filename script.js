// Enhanced Journal App JavaScript

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';
let selectedMood = '';
let currentDate = new Date();
let selectedCalendarDate = null;
let calendarDayElements = [];

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
const calendarDaysContainer = document.getElementById('calendarDays');

// Add these at the top with other DOM elements
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEntries();
    setupEventListeners();
    renderCalendar();
    displayEntries();
    populateMonthYearSelectors();
    syncMonthYearSelectors();
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
    selectedMood = '';
    selectedMoodInput.value = '';
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
    }, 300);
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
    
    card.innerHTML = `
        <div class="entry-header">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-mood" title="${moodInfo.name}">${moodInfo.emoji}</span>
        </div>
        <div class="entry-text">${entry.text.replace(/\n/g, '<br>')}</div>
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
});
yearSelect.addEventListener('change', function() {
    currentDate.setFullYear(parseInt(yearSelect.value));
    renderCalendar();
});

// Update dropdowns when navigating months
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// Update renderCalendar to sync selectors
function renderCalendar() {
    if (!calendarDaysContainer) {
        console.error("Calendar container not found!");
        return;
    }
    syncMonthYearSelectors();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ...
    
    calendarDaysContainer.innerHTML = '';
    let cells = 0;
    // Insert blank divs before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
        cells++;
    }
    // Render days 1–N
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
        cells++;
    }
    // Fill the rest of the 35 cells with blank divs
    while (cells < 35) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDaysContainer.appendChild(emptyDay);
        cells++;
    }
} 
// Journal App JavaScript
// This file contains all the logic for the journaling application

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';

// DOM elements
const journalForm = document.getElementById('journalForm');
const entryText = document.getElementById('entryText');
const moodSelect = document.getElementById('moodSelect');
const entriesContainer = document.getElementById('entriesContainer');
const noEntries = document.getElementById('noEntries');
const searchInput = document.getElementById('searchInput');
const moodFilter = document.getElementById('moodFilter');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEntries();
    displayEntries();
    setupEventListeners();
});

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Form submission for new entries
    journalForm.addEventListener('submit', handleFormSubmit);
    
    // Search and filter functionality
    searchInput.addEventListener('input', filterEntries);
    moodFilter.addEventListener('change', filterEntries);
}

/**
 * Handles the form submission when user saves a new entry
 * @param {Event} event - The form submission event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const text = entryText.value.trim();
    const mood = moodSelect.value;
    
    // Validate that text is not empty
    if (!text) {
        alert('Please write something in your journal entry!');
        return;
    }
    
    // Create new entry object
    const newEntry = {
        id: Date.now(), // Use timestamp as unique ID
        text: text,
        mood: mood,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    // Add entry to array and save
    journalEntries.unshift(newEntry); // Add to beginning of array
    saveEntries();
    displayEntries();
    
    // Show success message
    showSuccessMessage('Journal entry saved successfully!');
    
    // Reset form
    journalForm.reset();
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
        }
    } catch (error) {
        console.error('Error loading entries from localStorage:', error);
        journalEntries = [];
    }
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
            ${entry.mood ? `<span class="entry-mood">${moodInfo.emoji} ${moodInfo.text}</span>` : ''}
        </div>
        <div class="entry-text">${entry.text}</div>
    `;
    
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
 * Filters entries based on search text and mood selection
 */
function filterEntries() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedMood = moodFilter.value;
    
    let filteredEntries = journalEntries;
    
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
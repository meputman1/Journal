// Journal App JavaScript
// This file contains all the logic for the journaling application

// Global variables
let journalEntries = [];
const STORAGE_KEY = 'journalEntries';
let selectedMood = '';

// DOM elements
const journalForm = document.getElementById('journalForm');
const entryText = document.getElementById('entryText');
const selectedMoodInput = document.getElementById('selectedMood');
const entriesContainer = document.getElementById('entriesContainer');
const noEntries = document.getElementById('noEntries');
const searchInput = document.getElementById('searchInput');
const moodButtons = document.querySelectorAll('.mood-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

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
            ${entry.mood ? `<span class="entry-mood">${moodInfo.emoji} ${moodInfo.name}</span>` : ''}
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
 * Filters entries based on search text and mood selection
 */
function filterEntries() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeFilterButton = document.querySelector('.filter-btn.active');
    const selectedMood = activeFilterButton ? activeFilterButton.dataset.mood : '';
    
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
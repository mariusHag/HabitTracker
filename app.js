// Notion API Configuration
const notionApiKey = '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';
const notionDatabaseId = '1c5a27163198800b9a01e5d69cc3d368';

// Utility functions (same as before)
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
}

function isAllowedDateForHabit(habitFrequency, startDate, date) {
    if (habitFrequency === 'daily') return true;
    if (habitFrequency === 'every-second-day') {
        let start = parseDate(startDate);
        let diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));
        return diffDays % 2 === 0;
    }
    return false;
}

// Calculate current streak (same as before)
async function calculateStreak(habitName, habitFrequency, startDate, currentDateStr) {
    // ... (unchanged)
}

// Update longest streak (same as before)
async function updateLongestStreak(habitName, currentStreak) {
    // ... (unchanged)
}

// Global current selected date (same as before)
let selectedDate = new Date();

// DOM Elements (same as before)
const currentDateSpan = document.getElementById('current-date');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const todayBtn = document.getElementById('today-btn');
const habitList = document.getElementById('habit-list');
const addHabitBtn = document.getElementById('add-habit-btn');
const habitModal = document.getElementById('habit-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const habitNameInput = document.getElementById('habit-name');
const habitFrequencyInput = document.getElementById('habit-frequency');
const modalTitle = document.getElementById('modal-title');

// Update the display of the Today button (same as before)
function updateTodayButton() {
    // ... (unchanged)
}

// Display the currently selected date (same as before)
function updateDateDisplay() {
    // ... (unchanged)
}

// Notion API functions (with improved error handling)
async function createHabit(habitName, frequency, startDate) {
    try {
        const response = await fetch(`https://api.notion.com/v1/pages`, {
            // ... (same as before)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create habit:', errorData);
            alert('Failed to create habit. See console for details.');
            throw new Error('Failed to create habit');
        }
    } catch (error) {
        console.error('Error creating habit:', error);
        alert('An error occurred while creating habit. See console for details.');
        throw error; // Re-throw the error to be caught by the caller
    }
}

async function getHabits() {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
            // ... (same as before)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to get habits:', errorData);
            alert('Failed to get habits. See console for details.');
            return [];
        }

        const data = await response.json();
        return data.results.map((result) => ({
            // ... (same as before)
        }));
    } catch (error) {
        console.error('Error getting habits:', error);
        alert('An error occurred while getting habits. See console for details.');
        return [];
    }
}

async function voteHabit(habitName, date, completed) {
    try {
        await fetch(`https://api.notion.com/v1/pages`, {
            // ... (same as before)
        });
    } catch (error) {
        console.error('Error voting habit:', error);
        alert('An error occurred while voting habit. See console for details.');
    }
}

async function checkHabitCompletion(habitName, date) {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
            // ... (same as before)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to check habit completion:', errorData);
            return false;
        }

        const data = await response.json();
        return data.results.length > 0 && data.results[0].properties.Completed.checkbox;
    } catch (error) {
        console.error('Error checking habit completion:', error);
        alert('An error occurred while checking habit completion. See console for details.');
        return false;
    }
}

async function getLongestStreak(habitName) {
    // ... (same as before)
}

async function updateHabitLongestStreak(habitName, longestStreak) {
    try {
        await fetch(`https://api.notion.com/v1/pages/${habit.id}`, {
            // ... (same as before)
        });
    } catch (error) {
        console.error('Error updating longest streak:', error);
        alert('An error occurred while updating longest streak. See console for details.');
    }
}

// Render the habit list (with loading indicator)
async function renderHabits() {
    habitList.innerHTML = '<p>Loading habits...</p>'; // Loading indicator
    const habits = await getHabits();
    habitList.innerHTML = ''; // Clear loading indicator
    // ... (rest of the renderHabits function - same as before)
}

// Update a habit vote for the selected date (same as before)
async function voteForHabit(habitName) {
    // ... (same as before)
}

async function getHabitFrequency(habitName) {
    // ... (same as before)
}

async function getHabitStartDate(habitName) {
    // ... (same as before)
}

// Event listeners (with UI improvements)
prevDayBtn.addEventListener('click', async () => {
    // ... (same as before)
});

nextDayBtn.addEventListener('click', async () => {
    // ... (same as before)
});

todayBtn.addEventListener('click', async () => {
    // ... (same as before)
});

addHabitBtn.addEventListener('click', () => {
    // ... (same as before)
});

closeModalBtn.addEventListener('click', () => {
    // ... (same as before)
});

saveHabitBtn.addEventListener('click', async () => {
    const name = habitNameInput.value.trim();
    const frequency = habitFrequencyInput.value;
    if (!name) {
        alert('Please enter a habit name');
        return;
    }

    saveHabitBtn.disabled = true; // Disable button while saving
    try {
        await createHabit(name, frequency, formatDate(new Date()));
        habitModal.style.display = 'none';
        habitNameInput.value = ''; // Clear input
        habitFrequencyInput.value = 'daily'; //reset frequency
        await renderHabits();
    } catch (error) {
        // Error handling already in createHabit
    } finally {
        saveHabitBtn.disabled = false; // Re-enable button
    }
});

// Event delegation for vote button clicks (same as before)
habitList.addEventListener('click', (e) => {
    // ... (same as before)
});

// Initialize display (same as before)
updateDateDisplay();
renderHabits();
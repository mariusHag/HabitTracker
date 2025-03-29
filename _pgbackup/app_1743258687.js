// Notion API Configuration
const notionApiKey = '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'; // Replace with your Notion API key
const notionDatabaseId = '1c5a27163198800b9a01e5d69cc3d368'; // Replace with your database ID

// Utility functions
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

// Calculate current streak up to (and including) the given date
async function calculateStreak(habitName, habitFrequency, startDate, currentDateStr) {
    let streak = 0;
    let date = parseDate(currentDateStr);

    if (!isAllowedDateForHabit(habitFrequency, startDate, date)) {
        return streak;
    }

    const step = habitFrequency === 'daily' ? 1 : 2;

    while (true) {
        if (!isAllowedDateForHabit(habitFrequency, startDate, date)) {
            date.setDate(date.getDate() - 1);
            continue;
        }
        let dStr = formatDate(date);
        const completed = await checkHabitCompletion(habitName, dStr);
        if (completed) {
            streak++;
            date.setDate(date.getDate() - step);
        } else {
            break;
        }
    }
    return streak;
}

// Update longest streak if current exceeds stored value
async function updateLongestStreak(habitName, currentStreak) {
    const longestStreak = await getLongestStreak(habitName);
    if (currentStreak > longestStreak) {
        await updateHabitLongestStreak(habitName, currentStreak);
    }
}

// Global current selected date (default today)
let selectedDate = new Date();

// DOM Elements
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

// Update the display of the Today button based on selected date
function updateTodayButton() {
    const today = new Date();
    const todayStr = formatDate(today);
    const selectedStr = formatDate(selectedDate);

    if (todayStr !== selectedStr) {
        todayBtn.disabled = false;
        todayBtn.classList.add('active');
    } else {
        todayBtn.disabled = true;
        todayBtn.classList.remove('active');
    }
}

// Display the currently selected date
function updateDateDisplay() {
    currentDateSpan.textContent = formatDate(selectedDate);
    updateTodayButton();
}

// Notion API functions
async function createHabit(habitName, frequency, startDate) {
    await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
            parent: { database_id: notionDatabaseId },
            properties: {
                'Habit Name': { title: [{ text: { content: habitName } }] },
                'Frequency': { select: { name: frequency } },
                'Start Date': { date: { start: startDate } },
                'Streak':{number: 0},
                'Longest Streak': {number: 0},
            },
        }),
    });
}

async function getHabits() {
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
    });
    const data = await response.json();
    return data.results.map((result) => ({
        id: result.id,
        name: result.properties['Habit Name'].title[0].text.content,
        frequency: result.properties['Frequency'].select.name,
        startDate: result.properties['Start Date'].date.start,
        streak: result.properties['Streak'].number,
        longestStreak: result.properties['Longest Streak'].number,
    }));
}

async function voteHabit(habitName, date, completed) {
    await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
            parent: { database_id: notionDatabaseId },
            properties: {
                'Habit Name': { title: [{ text: { content: habitName } }] },
                'Date': { date: { start: date } },
                'Completed': { checkbox: completed },
            },
        }),
    });
}

async function checkHabitCompletion(habitName, date) {
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
            filter: {
                and: [
                    { property: 'Habit Name', title: { equals: habitName } },
                    { property: 'Date', date: { equals: date } },
                ],
            },
        }),
    });
    const data = await response.json();
    return data.results.length > 0 && data.results[0].properties.Completed.checkbox;
}

async function getLongestStreak(habitName){
    const habits = await getHabits();
    const habit = habits.find(h => h.name === habitName);
    return habit.longestStreak;
}

async function updateHabitLongestStreak(habitName, longestStreak){
    const habits = await getHabits();
    const habit = habits.find(h => h.name === habitName);
    await fetch(`https://api.notion.com/v1/pages/${habit.id}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
            properties: {
                'Longest Streak': {number: longestStreak},
            },
        }),
    });
}

// Render the habit list for the selected date
async function renderHabits() {
    habitList.innerHTML = '';
    const habits = await getHabits();
    const currentDateStr = formatDate(selectedDate);
    for(const habit of habits){
        const habitItem = document.createElement('div');
        habitItem.classList.add('habit-item');
        const allowedToday = isAllowedDateForHabit(habit.frequency, habit.startDate, selectedDate);
        if (!allowedToday) {
            habitItem.classList.add('disabled');
        }
        const currentStreak = await calculateStreak(habit.name, habit.frequency, habit.startDate, currentDateStr);
        await updateLongestStreak(habit.name, currentStreak);

        habitItem.innerHTML = `
            <div class="habit-header">${habit.name}</div>
            <div class="habit-streaks">Current: ${currentStreak} | Longest: ${habit.longestStreak}</div>
            <div class="vote-area">
                <button class="vote-btn" data-name="${habit.name}">
                    ${await checkHabitCompletion(habit.name, currentDateStr) ? 'Voted' : 'Vote'}
                </button>
            </div>
        `;
        const voteBtn = habitItem.querySelector('.vote-btn');
        if (await checkHabitCompletion(habit.name, currentDateStr)) {
            voteBtn.disabled = true;
        }
        if (!allowedToday) {
            voteBtn.disabled = true;
        }
        habitList.appendChild(habitItem);
    }
}
// Update a habit vote for the selected date
async function voteForHabit(habitName) {
    const currentDateStr = formatDate(selectedDate);
    if (await checkHabitCompletion(habitName, currentDateStr)) return;
    if (!isAllowedDateForHabit(await getHabitFrequency(habitName), await getHabitStartDate(habitName), selectedDate)) return;
    await voteHabit(habitName, currentDateStr, true);
    await renderHabits();
}

async function getHabitFrequency(habitName){
    const habits = await getHabits();
    const habit = habits.find(h => h.name === habitName);
    return habit.frequency;
}

async function getHabitStartDate(habitName){
    const habits = await getHabits();
    const habit = habits.find(h => h.name === habitName);
    return habit.startDate;
}

// Event listeners for day navigation
prevDayBtn.addEventListener('click', async () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    updateDateDisplay();
    await renderHabits();
});

nextDayBtn.addEventListener('click', async () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    updateDateDisplay();
    await renderHabits();
});

todayBtn.addEventListener('click', async () => {
    selectedDate = new Date();
    updateDateDisplay();
    await renderHabits();
});

// Open modal to add a habit
addHabitBtn.addEventListener('click', () => {
    habitModal.style.display = 'flex';
    modalTitle.textContent = 'Add Habit';
    saveHabitBtn.textContent = 'Save Habit';
    habitNameInput.value = '';
    habitFrequencyInput.value = 'daily';
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    habitModal.style.display = 'none';
});

// Save new habit
saveHabitBtn.addEventListener('click', async () => {
    const name = habitNameInput.value.trim();
    const frequency = habitFrequencyInput.value;
    if (!name) {
        alert('Please enter a habit name');
        return;
    }

    try {
        await createHabit(name, frequency, formatDate(new Date()));
        habitModal.style.display = 'none'; // Close the modal here
        await renderHabits();
    } catch (error) {
        // Handle error from createHabit (if necessary)
        console.error('Error in saveHabitBtn:', error);
        alert('An error occurred while saving habit. See console for details.');
    }
});

// Initialize display
updateDateDisplay();
renderHabits();
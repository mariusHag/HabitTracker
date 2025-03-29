// Utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function parseDate(dateString) {
  return new Date(dateString + "T00:00:00");
}

// For "every-second-day" habits, allowed if difference from start is even.
function isAllowedDateForHabit(habit, date) {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'every-second-day') {
    let start = parseDate(habit.startDate);
    let diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }
  return false;
}

// Calculate current streak up to (and including) the given date
function calculateStreak(habit, currentDateStr) {
  let streak = 0;
  let date = parseDate(currentDateStr);
  const votes = habit.votes || {};

  if (!isAllowedDateForHabit(habit, date)) {
    // If current day is not allowed, streak is 0 (or you might choose to skip this day)
    return streak;
  }

  // For daily habits, subtract one day at a time;
  // for every-second-day habits, subtract two days at a time.
  const step = habit.frequency === 'daily' ? 1 : 2;

  while (true) {
    if (!isAllowedDateForHabit(habit, date)) {
      // Skip days that are not allowed for every-second-day (should not happen in our backward check)
      date.setDate(date.getDate() - 1);
      continue;
    }
    let dStr = formatDate(date);
    if (votes[dStr]) {
      streak++;
      date.setDate(date.getDate() - step);
    } else {
      break;
    }
  }
  return streak;
}

// Update longest streak if current exceeds stored value
function updateLongestStreak(habit, currentStreak) {
  if (currentStreak > (habit.longestStreak || 0)) {
    habit.longestStreak = currentStreak;
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
  
  // If viewing a day other than today, enable and highlight the button.
  if (todayStr !== selectedStr) {
    todayBtn.disabled = false;
    todayBtn.classList.add("active");
  } else {
    todayBtn.disabled = true;
    todayBtn.classList.remove("active");
  }
}

// Display the currently selected date
function updateDateDisplay() {
  currentDateSpan.textContent = formatDate(selectedDate);
  updateTodayButton();
}

// Load habits from localStorage
function loadHabits() {
  return JSON.parse(localStorage.getItem('habits')) || [];
}

// Save habits to localStorage
function saveHabits(habits) {
  localStorage.setItem('habits', JSON.stringify(habits));
}

// Render the habit list for the selected date
function renderHabits() {
  habitList.innerHTML = '';
  const habits = loadHabits();
  const currentDateStr = formatDate(selectedDate);

  habits.forEach((habit, index) => {
    const habitItem = document.createElement('div');
    habitItem.classList.add('habit-item');

    // Check if this day is allowed for this habit.
    const allowedToday = isAllowedDateForHabit(habit, selectedDate);

    // If not allowed, add a disabled style.
    if (!allowedToday) {
      habitItem.classList.add('disabled');
    }

    // Calculate current streak
    const currentStreak = calculateStreak(habit, currentDateStr);
    updateLongestStreak(habit, currentStreak);

    habitItem.innerHTML = `
      <div class="habit-header">${habit.name}</div>
      <div class="habit-streaks">Current: ${currentStreak} | Longest: ${habit.longestStreak || 0}</div>
      <div class="vote-area">
        <button class="vote-btn" data-index="${index}">
          ${habit.votes && habit.votes[currentDateStr] ? 'Voted' : 'Vote'}
        </button>
      </div>
    `;

    // Disable vote button if:
    // 1. Already voted for today, OR
    // 2. Today is not allowed for an every-second-day habit.
    const voteBtn = habitItem.querySelector('.vote-btn');
    if (habit.votes && habit.votes[currentDateStr]) {
      voteBtn.disabled = true;
    }
    if (!allowedToday) {
      voteBtn.disabled = true;
    }

    habitList.appendChild(habitItem);
  });
  // Save updated longest streaks in case they changed.
  saveHabits(habits);
}

// Update a habit vote for the selected date
function voteForHabit(index) {
  const habits = loadHabits();
  const habit = habits[index];
  const currentDateStr = formatDate(selectedDate);
  // Prevent double voting.
  if (!habit.votes) habit.votes = {};
  if (habit.votes[currentDateStr]) return;

  // Only allow vote if allowed on this date.
  if (!isAllowedDateForHabit(habit, selectedDate)) return;

  habit.votes[currentDateStr] = true;
  // Recalculate streaks
  const currentStreak = calculateStreak(habit, currentDateStr);
  updateLongestStreak(habit, currentStreak);
  saveHabits(habits);
  renderHabits();
}

// Event listeners for day navigation
prevDayBtn.addEventListener('click', () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  updateDateDisplay();
  renderHabits();
});

nextDayBtn.addEventListener('click', () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  updateDateDisplay();
  renderHabits();
});

todayBtn.addEventListener('click', () => {
  selectedDate = new Date();
  updateDateDisplay();
  renderHabits();
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
saveHabitBtn.addEventListener('click', () => {
  const name = habitNameInput.value.trim();
  const frequency = habitFrequencyInput.value;
  if (!name) {
    alert('Please enter a habit name');
    return;
  }
  let habits = loadHabits();
  // Create a new habit object. The displayed name is clean.
  const newHabit = {
    name: name,
    frequency: frequency,
    startDate: formatDate(new Date()),
    votes: {},
    streak: 0,
    longestStreak: 0,
  };
  habits.push(newHabit);
  saveHabits(habits);
  habitModal.style.display = 'none';
  renderHabits();
});

// Event delegation for vote button clicks
habitList.addEventListener('click', (e) => {
  if (e.target.classList.contains('vote-btn')) {
    const index = e.target.getAttribute('data-index');
    voteForHabit(index);
  }
});

// Initialize display
updateDateDisplay();
renderHabits();

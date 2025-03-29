document.addEventListener('DOMContentLoaded', () => {
    const habitList = document.getElementById('habit-list');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const habitModal = document.getElementById('habit-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveHabitBtn = document.getElementById('save-habit-btn');
    const habitNameInput = document.getElementById('habit-name');
    const habitFrequencyInput = document.getElementById('habit-frequency');

    // Load habits from localStorage
    const loadHabits = () => {
        habitList.innerHTML = '';
        const habits = JSON.parse(localStorage.getItem('habits')) || [];
        habits.forEach((habit, index) => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            habitItem.innerHTML = `
                <span>${habit.name} (${habit.frequency})</span>
                <span>Streak: ${habit.streak}</span>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            habitList.appendChild(habitItem);
        });
    };

    // Open modal to add a new habit
    addHabitBtn.addEventListener('click', () => {
        habitModal.style.display = 'flex';
        modalTitle.textContent = 'Add Habit';
        saveHabitBtn.textContent = 'Save Habit';
        habitNameInput.value = '';
        habitFrequencyInput.value = 'daily';
    });

    // Close the modal
    closeModalBtn.addEventListener('click', () => {
        habitModal.style.display = 'none';
    });

    // Save a new habit
    saveHabitBtn.addEventListener('click', () => {
        const habitName = habitNameInput.value.trim();
        const habitFrequency = habitFrequencyInput.value;
        if (habitName === '') {
            alert('Please enter a habit name');
            return;
        }
        const habits = JSON.parse(localStorage.getItem('habits')) || [];
        habits.push({ name: habitName, frequency: habitFrequency, streak: 0 });
        localStorage.setItem('habits', JSON.stringify(habits));
        habitModal.style.display = 'none';
        loadHabits();
    });

    // Delete a habit
    habitList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.getAttribute('data-index');
            const habits = JSON.parse(localStorage.getItem('habits')) || [];
            habits.splice(index, 1);
            localStorage.setItem('habits', JSON.stringify(habits));
            loadHabits();
        }
    });

    // Initialize the habit tracker
    loadHabits();
});

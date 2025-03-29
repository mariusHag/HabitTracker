async function createHabit(habitName, frequency, startDate) {
    try {
        const response = await fetch(`https://api.notion.com/v1/pages`, {
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

        if (!response.ok) {
            // Handle non-2xx HTTP responses
            const errorData = await response.json();
            console.error('Failed to create habit:', errorData);
            alert('Failed to create habit. See console for details.');
            return; // Exit the function if there's an error
        }

        // Handle successful response (e.g., log success)
        console.log('Habit created successfully.');
    } catch (error) {
        // Handle network errors or other exceptions
        console.error('Error creating habit:', error);
        alert('An error occurred while creating habit. See console for details.');
    }
}
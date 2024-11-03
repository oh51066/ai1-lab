document.addEventListener('DOMContentLoaded', function() {
    // Funkcja do pobrania zadań z Local Storage
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTaskToDOM(task.text, task.date, task.completed));
    }

    // Funkcja do zapisywania zadań do Local Storage
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll('#todoList li').forEach(taskItem => {
            const text = taskItem.querySelector('.taskText').textContent;
            const date = taskItem.querySelector('.taskDate').textContent;
            const completed = taskItem.classList.contains('completed');
            tasks.push({ text, date, completed });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Funkcja do dodania zadania do DOM
    function addTaskToDOM(taskText, taskDate, completed = false) {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');

        const taskSpan = document.createElement('span');
        taskSpan.classList.add('taskText');
        taskSpan.textContent = taskText;

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('taskDate');
        dateSpan.textContent = taskDate ? taskDate : '';

        const deleteButton = document.createElement('span');
        deleteButton.textContent = '🗑';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', function() {
            taskItem.remove();  // Usunięcie zadania natychmiast
            saveTasks(); // Zapisz zmiany po usunięciu zadania
        });

        taskItem.appendChild(taskSpan);
        taskItem.appendChild(dateSpan);
        taskItem.appendChild(deleteButton);

        // Kliknięcie na nazwę zadania, aby ją edytować bezpośrednio
        taskSpan.addEventListener('click', function() {
            const inputText = document.createElement('input');
            inputText.type = 'text';
            inputText.value = taskSpan.textContent;
            inputText.classList.add('editText');
            taskSpan.replaceWith(inputText); // Zamiana span na pole tekstowe

            const errorSpan = document.createElement('span');
            errorSpan.classList.add('error');
            taskItem.appendChild(errorSpan);

            // Po opuszczeniu pola tekstowego lub naciśnięciu Enter
            inputText.addEventListener('blur', saveEditedText);
            inputText.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    saveEditedText();
                }
            });

            function saveEditedText() {
                const newText = inputText.value.trim();

                // Walidacja długości tekstu
                if (newText.length < 3 || newText.length > 255) {
                    errorSpan.textContent = 'Zadanie musi mieć od 3 do 255 znaków.';
                    return;
                } else {
                    errorSpan.textContent = '';
                }

                taskSpan.textContent = newText;
                inputText.replaceWith(taskSpan); // Zastąpienie pola tekstowego ponownie spanem
                saveTasks(); // Zapisz zmiany po edycji
            }

            inputText.focus(); // Automatyczne zaznaczenie pola tekstowego
        });

        // Kliknięcie na datę zadania, aby ją edytować za pomocą kalendarza
        dateSpan.addEventListener('click', function() {
            const inputDate = document.createElement('input');
            inputDate.type = 'date';
            inputDate.value = taskDate || '';

            dateSpan.replaceWith(inputDate); // Zamiana span z datą na pole wyboru daty

            inputDate.addEventListener('blur', function() {
                const newDate = inputDate.value;

                // Walidacja daty
                if (newDate && isDateValid(newDate)) {
                    dateSpan.textContent = newDate;
                } else if (newDate === '') {
                    dateSpan.textContent = ''; // Pozwól na usunięcie daty
                } else {
                    alert('Wprowadzono niepoprawną datę. Data musi być w przyszłości.');
                }

                inputDate.replaceWith(dateSpan); // Przywrócenie elementu span po wybraniu daty
                saveTasks(); // Zapisz zmiany po edycji daty
            });

            inputDate.focus(); // Automatycznie otwórz kalendarz po kliknięciu
        });

        if (completed) {
            taskItem.classList.add('completed');
        }

        document.getElementById('todoList').appendChild(taskItem);
    }

    // Walidacja daty w przyszłości
    function isDateValid(taskDate) {
        if (!taskDate) return true; // Data może być pusta
        const today = new Date().setHours(0, 0, 0, 0); // Obecna data bez godzin
        const inputDate = new Date(taskDate).setHours(0, 0, 0, 0);
        return inputDate >= today;
    }

    // Obsługa formularza
    document.getElementById('todoForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const taskInput = document.getElementById('taskInput');
        const taskDate = document.getElementById('taskDate');
        const errorMessage = document.getElementById('errorMessage');
        const dateErrorMessage = document.getElementById('dateErrorMessage');
        const taskText = taskInput.value.trim();
        const taskDateValue = taskDate.value;

        // Walidacja długości tekstu
        if (taskText.length < 3 || taskText.length > 255) {
            errorMessage.style.display = 'block';
            return;
        } else {
            errorMessage.style.display = 'none';
        }

        // Walidacja daty
        if (!isDateValid(taskDateValue)) {
            dateErrorMessage.style.display = 'block';
            return;
        } else {
            dateErrorMessage.style.display = 'none';
        }

        addTaskToDOM(taskText, taskDateValue);
        saveTasks(); // Zapisz zadania po dodaniu nowego
        taskInput.value = '';
        taskDate.value = '';
    });

    // Obsługa wyszukiwania
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const taskItems = document.querySelectorAll('#todoList li');

        taskItems.forEach(item => {
            const taskText = item.querySelector('.taskText').textContent.toLowerCase();
            const originalText = item.querySelector('.taskText').textContent;

            // Sprawdź, czy zadanie pasuje do szukanej frazy
            if (taskText.includes(searchTerm)) {
                const highlightedText = highlightMatch(originalText, searchTerm);
                item.querySelector('.taskText').innerHTML = highlightedText;
                item.style.display = ''; // Pokaż dopasowane zadania
            } else {
                item.style.display = 'none'; // Ukryj niedopasowane zadania
            }
        });
    });

    // Funkcja do podświetlania pasujących liter w wyszukiwarce
    function highlightMatch(text, searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Ładowanie zadań przy starcie
    loadTasks();
});

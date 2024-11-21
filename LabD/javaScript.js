// Obsługa przycisku sprawdzania pogody
document.getElementById('get-weather').addEventListener('click', () => {
    const city = document.getElementById('city-input').value.trim();
    const apiKey = '330c0b3eb2875300b151bdc93f8062cc'; // Zamień na swój klucz API

    if (!city) {
        alert('Proszę wprowadzić nazwę miasta.');
        return;
    }

    // URL do bieżącej pogody
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=PL`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', currentWeatherUrl, true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            console.log('Odpowiedź bieżąca pogoda:', data);

            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

            const now = new Date();
            const dateTimeString = now.toLocaleString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const currentWeatherContainer = document.getElementById('current-weather');
            currentWeatherContainer.innerHTML = ''; // Czyszczenie poprzedniej zawartości

            const weatherTitle = document.createElement('h2');
            weatherTitle.textContent = `Bieżąca pogoda w ${data.name}, ${data.sys.country}`;
            currentWeatherContainer.appendChild(weatherTitle);

            const dateTimeParagraph = document.createElement('p');
            dateTimeParagraph.textContent = `Dane zaktualizowano: ${dateTimeString}`;
            currentWeatherContainer.appendChild(dateTimeParagraph);

            const weatherContainer = document.createElement('div');
            weatherContainer.classList.add('weather-container');

            const weatherIcon = document.createElement('img');
            weatherIcon.classList.add('weather-icon');
            weatherIcon.src = iconUrl;
            weatherIcon.alt = data.weather[0].description;
            weatherContainer.appendChild(weatherIcon);

            const weatherDetails = document.createElement('div');
            weatherDetails.classList.add('weather-details');

            const temperature = document.createElement('p');
            temperature.textContent = `Temperatura: ${data.main.temp}°C`;
            weatherDetails.appendChild(temperature);

            const description = document.createElement('p');
            description.textContent = data.weather[0].description;
            weatherDetails.appendChild(description);

            const humidity = document.createElement('p');
            humidity.textContent = `Wilgotność: ${data.main.humidity}%`;
            weatherDetails.appendChild(humidity);

            weatherContainer.appendChild(weatherDetails);
            currentWeatherContainer.appendChild(weatherContainer);
        } else {
            console.error('Błąd przy pobieraniu bieżącej pogody:', xhr.statusText);
        }
    };

    xhr.onerror = function() {
        console.error('Żądanie nie powiodło się.');
    };

    xhr.send();

    // URL do prognozy pogody
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=PL`;

    // Pobranie danych prognozy za pomocą Fetch
    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Odpowiedź prognoza pogody:', data); // Logowanie odpowiedzi

            const forecastContainer = document.getElementById('forecast');
            forecastContainer.innerHTML = ''; // Czyszczenie poprzedniej zawartości

            const forecastTitle = document.createElement('h2');
            forecastTitle.textContent = 'Prognoza godzinowa';
            forecastContainer.appendChild(forecastTitle);

            const forecastGroupedByDay = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const day = date.toLocaleDateString();
                const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const iconCode = item.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

                if (!forecastGroupedByDay[day]) {
                    forecastGroupedByDay[day] = [];
                }
                forecastGroupedByDay[day].push({
                    time: time,
                    temp: item.main.temp,
                    description: item.weather[0].description,
                    iconUrl: iconUrl,
                    humidity: item.main.humidity
                });
            });

            Object.entries(forecastGroupedByDay).forEach(([day, forecasts]) => {
                const dayHeader = document.createElement('h3');
                dayHeader.textContent = day;
                forecastContainer.appendChild(dayHeader);

                forecasts.forEach(forecast => {
                    const forecastItem = document.createElement('div');
                    forecastItem.classList.add('weather-container');

                    const forecastIcon = document.createElement('img');
                    forecastIcon.classList.add('weather-icon');
                    forecastIcon.src = forecast.iconUrl;
                    forecastIcon.alt = forecast.description;
                    forecastItem.appendChild(forecastIcon);

                    const forecastDetails = document.createElement('div');
                    forecastDetails.classList.add('weather-details');

                    const time = document.createElement('p');
                    time.innerHTML = `<strong>${forecast.time}</strong>`;
                    forecastDetails.appendChild(time);

                    const temperature = document.createElement('p');
                    temperature.textContent = `Temperatura: ${forecast.temp}°C`;
                    forecastDetails.appendChild(temperature);

                    const description = document.createElement('p');
                    description.textContent = forecast.description;
                    forecastDetails.appendChild(description);

                    const humidity = document.createElement('p');
                    humidity.textContent = `Wilgotność: ${forecast.humidity}%`;
                    forecastDetails.appendChild(humidity);

                    forecastItem.appendChild(forecastDetails);
                    forecastContainer.appendChild(forecastItem);
                });
            });
        })
        .catch(error => {
            const forecastContainer = document.getElementById('forecast');
            forecastContainer.textContent = 'Nie udało się pobrać danych o prognozie.';
            console.error('Błąd przy pobieraniu prognozy:', error);
        });
});

// Inicjalizacja mapy
const map = L.map('map').setView([22.505, -0.09], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Obsługa lokalizacji użytkownika
document.getElementById('myLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup('Twoja lokalizacja')
                    .openPopup();
            },
            error => {
                alert("Nie udało się uzyskać lokalizacji.");
            }
        );
    } else {
        alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
    }
});

// Pobranie mapy i stworzenie puzzli
document.getElementById('downloadMapBtn').addEventListener('click', () => {
    leafletImage(map, function(err, canvas) {
        if (err) {
            console.error("Nie udało się pobrać mapy:", err);
            return;
        }
        const pieces = createPuzzle(canvas);
        renderPuzzle(pieces);
    });
});

// Funkcja tworząca puzzle
function createPuzzle(canvas) {
    const pieceSize = 100;
    const pieces = [];

    // Tworzenie kawałków puzzli
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceSize;
            pieceCanvas.height = pieceSize;
            const ctx = pieceCanvas.getContext('2d');
            ctx.drawImage(canvas, x * pieceSize, y * pieceSize, pieceSize, pieceSize, 0, 0, pieceSize, pieceSize);

            const piece = {
                element: pieceCanvas,
                correctX: x,
                correctY: y,
                currentX: x,  // Ustaw pozycję początkową jako poprawną
                currentY: y   // Ustaw pozycję początkową jako poprawną
            };
            piece.element.classList.add("puzzle-piece");
            piece.element.draggable = true;
            piece.element.setAttribute("data-correct-x", x);
            piece.element.setAttribute("data-correct-y", y);
            pieces.push(piece);
        }
    }

    // Losowe przetasowanie puzzli w tablicy
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }

    return pieces;
}

// Funkcja renderująca puzzle w strefie scatter
function renderPuzzle(pieces) {
    const scatterArea = document.getElementById('puzzle-scatter');
    scatterArea.innerHTML = '';

    pieces.forEach((piece, i) => {
        scatterArea.appendChild(piece.element);
        piece.element.style.position = 'absolute';

        // Ustawienie puzzla w losowych, ale sąsiadujących pozycjach
        piece.currentX = Math.floor(i % 4); // X w układzie 4x4
        piece.currentY = Math.floor(i / 4);  // Y w układzie 4x4

        piece.element.style.left = `${piece.currentX * 100}px`;
        piece.element.style.top = `${piece.currentY * 100}px`;

        // Obsługa przeciągania
        piece.element.addEventListener('dragstart', e => onDragStart(e, piece));
        piece.element.addEventListener('dragover', e => e.preventDefault());
        piece.element.addEventListener('drop', e => onDrop(e, piece));
    });
}


// Przechowywanie przeciąganego elementu
let draggedPiece = null;
let correctlyPlacedPieces = 0;  // Licznik poprawnie umieszczonych kawałków
let isCompleted = false;  // Flaga ukończenia puzzli

function onDragStart(e, piece) {
    draggedPiece = piece;
}

function onDrop(event, piece) {
    event.preventDefault();

    // Współrzędne docelowe, na które przeciągnięto puzzel
    const targetX = Math.floor(event.offsetX / 100);
    const targetY = Math.floor(event.offsetY / 100);

    // Sprawdzenie, czy kawałek jest na poprawnej pozycji
    const isCorrectPosition = targetX === piece.correctX && targetY === piece.correctY;

    if (isCorrectPosition) {
        // Jeśli kawałek jest na poprawnej pozycji
        piece.isPlaced = true;
        piece.element.style.left = `${targetX * 100}px`;
        piece.element.style.top = `${targetY * 100}px`;
    } else {
        // Jeśli kawałek nie jest na poprawnej pozycji, przywróć go do pierwotnej
        piece.element.style.left = `${piece.currentX * 100}px`;
        piece.element.style.top = `${piece.currentY * 100}px`;
    }

    // Aktualizacja bieżących współrzędnych
    piece.currentX = targetX;
    piece.currentY = targetY;

    // Sprawdzenie, czy wszystkie kawałki są na poprawnej pozycji
    checkCompletion();
}

// Funkcja upuszczania puzzla w obszarze planszy docelowej
document.getElementById('puzzle-board').addEventListener('dragover', e => e.preventDefault());
document.getElementById('puzzle-board').addEventListener('drop', e => {
    e.preventDefault();
    if (draggedPiece) {
        // Ustawienie puzzla na współrzędnych w obszarze docelowym
        const targetX = Math.floor(e.offsetX / 100);
        const targetY = Math.floor(e.offsetY / 100);

        // Wyszukiwanie puzzla, który już jest na tej pozycji (jeśli istnieje)
        const occupyingPiece = Array.from(document.getElementById('puzzle-board').children).find(piece => {
            const currentX = parseInt(piece.style.left) / 100;
            const currentY = parseInt(piece.style.top) / 100;
            return currentX === targetX && currentY === targetY;
        });

        if (occupyingPiece) {
            // Zamiana pozycji z istniejącym puzzlem
            const occupyingPieceX = parseInt(occupyingPiece.style.left) / 100;
            const occupyingPieceY = parseInt(occupyingPiece.style.top) / 100;

            // Przeniesienie starego puzzla do pozycji przeciągniętego puzzla
            occupyingPiece.style.left = `${draggedPiece.currentX * 100}px`;
            occupyingPiece.style.top = `${draggedPiece.currentY * 100}px`;

            occupyingPiece.setAttribute("data-current-x", draggedPiece.currentX);
            occupyingPiece.setAttribute("data-current-y", draggedPiece.currentY);
        }

        // Sprawdzenie, czy kawałek jest na poprawnej pozycji
        const isCorrectPosition = targetX === parseInt(draggedPiece.element.getAttribute("data-correct-x")) &&
            targetY === parseInt(draggedPiece.element.getAttribute("data-correct-y"));

        if (isCorrectPosition && !draggedPiece.isPlaced) {
            correctlyPlacedPieces++;
            draggedPiece.isPlaced = true;  // Oznacz kawałek jako poprawnie umieszczony
        } else if (!isCorrectPosition && draggedPiece.isPlaced) {
            correctlyPlacedPieces--;
            draggedPiece.isPlaced = false;  // Oznacz kawałek jako niepoprawnie umieszczony
        }

        // Ustawienie nowej pozycji przeciągniętego puzzla
        draggedPiece.currentX = targetX;
        draggedPiece.currentY = targetY;
        updatePiecePosition(draggedPiece, 'puzzle-board');
        
        // Sprawdzenie, czy wszystkie kawałki są prawidłowo umieszczone
        checkCompletion();
    }
});

// Aktualizacja pozycji puzzla w odpowiednim obszarze
function updatePiecePosition(piece, area) {
    const container = document.getElementById(area);
    piece.element.style.position = 'absolute';
    piece.element.style.left = `${piece.currentX * 100}px`;
    piece.element.style.top = `${piece.currentY * 100}px`;
    container.appendChild(piece.element);
}

/// Sprawdzenie poprawności ułożenia puzzli
function checkCompletion() {
    if (isCompleted || correctlyPlacedPieces < 16) return;  // Zakończ, jeśli puzzle są ułożone lub kawałków jest mniej niż 16

    isCompleted = true;  // Ustaw flagę ukończenia
    console.log("Gratulacje! Ułożyłeś puzzle!");  // Komunikat w konsoli

    // Alternatywnie, możesz użyć powiadomień, jak wcześniej
    if (Notification.permission === "granted") {
        new Notification("Gratulacje! Ułożyłeś puzzle!");
    } else {
        alert("Gratulacje! Ułożyłeś puzzle!");
    }
}

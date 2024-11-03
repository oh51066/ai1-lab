// Inicjalizacja mapy
const map = L.map('map').setView([51.505, -0.09], 13);
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
                currentX: Math.floor(Math.random() * 4),
                currentY: Math.floor(Math.random() * 4)
            };
            piece.element.classList.add("puzzle-piece");
            piece.element.draggable = true;
            piece.element.setAttribute("data-correct-x", x);
            piece.element.setAttribute("data-correct-y", y);
            pieces.push(piece);
        }
    }
    return pieces;
}

// Funkcja renderująca puzzle w strefie scatter
function renderPuzzle(pieces) {
    const scatterArea = document.getElementById('puzzle-scatter');
    scatterArea.innerHTML = '';
    let i = 0;
    
    function placeNextPiece() {
        if (i >= pieces.length) return;  // Zakończ, gdy wszystkie puzzle są umieszczone
        
        const piece = pieces[i];
        scatterArea.appendChild(piece.element);
        piece.element.style.position = 'absolute';
        
        // Ustawienie puzzla na losowej pozycji
        piece.element.style.left = `${(i % 4) * 100 + Math.random() * 30}px`;
        piece.element.style.top = `${Math.floor(i / 4) * 100 + Math.random() * 30}px`;

        piece.element.addEventListener('dragstart', e => onDragStart(e, piece));
        piece.element.addEventListener('dragover', e => e.preventDefault());
        piece.element.addEventListener('drop', e => onDrop(e, piece));
        
        i++;
        requestAnimationFrame(placeNextPiece); // Dodanie kolejnego puzzla z opóźnieniem dla płynności
    }
    placeNextPiece(); // Rozpocznij renderowanie puzzli
}

// Przechowywanie przeciąganego elementu
let draggedPiece = null;

function onDragStart(e, piece) {
    draggedPiece = piece;
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

        // Ustawienie nowej pozycji przeciągniętego puzzla
        draggedPiece.currentX = targetX;
        draggedPiece.currentY = targetY;
        updatePiecePosition(draggedPiece, 'puzzle-board');
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

// Sprawdzenie poprawności ułożenia puzzli
function checkCompletion() {
    const allCorrect = Array.from(document.getElementById('puzzle-board').children).every(piece => {
        const correctX = parseInt(piece.getAttribute("data-correct-x"));
        const correctY = parseInt(piece.getAttribute("data-correct-y"));
        const currentX = parseInt(piece.style.left) / 100;
        const currentY = parseInt(piece.style.top) / 100;
        return currentX === correctX && currentY === correctY;
    });

    if (allCorrect && Notification.permission === "granted") {
        new Notification("Gratulacje! Ułożyłeś puzzle!");
    } else if (allCorrect) {
        alert("Gratulacje! Ułożyłeś puzzle!");
    }
}

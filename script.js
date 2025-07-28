// --- НАСТРОЙКА ---
const totalSounds = 100;
const totalPlakats = 127;
const plakatChangeInterval = 5000; // 5 секунд в миллисекундах
// --- КОНЕЦ НАСТРОЙКИ ---

// Получаем доступ к элементам на странице
const playButton = document.getElementById('playButton');
const audioPlayer = document.getElementById('audioPlayer');
const plakatImage = document.getElementById('plakatImage');
const plakatInfo = document.getElementById('plakatInfo');

// Массивы для хранения наших перемешанных плейлистов
let playlist = [];
let plakatPlaylist = [];

// Переменные для отслеживания состояния
let isPlaying = false;
let plakatTimer = null;

// Функция для создания массива чисел от 1 до totalSounds
function createOriginalPlaylist() {
    return Array.from({ length: totalSounds }, (_, i) => i + 1);
}

// Функция для создания массива чисел от 1 до totalPlakats
function createPlakatPlaylist() {
    return Array.from({ length: totalPlakats }, (_, i) => i + 1);
}

// Гарантирует качественное и равномерное перемешивание
function shufflePlaylist(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Функция для показа следующего плаката
function showNextPlakat() {
    // Проверяем, не закончился ли плейлист плакатов
    if (plakatPlaylist.length === 0) {
        console.log("Плейлист плакатов закончился. Создаю и перемешиваю новый.");
        let newPlakatPlaylist = createPlakatPlaylist();
        shufflePlaylist(newPlakatPlaylist);
        plakatPlaylist = newPlakatPlaylist;
    }

    // Берем следующий плакат из плейлиста
    const plakatIndex = plakatPlaylist.pop();
    
    // Показываем плакат
    const plakatSrc = `plakats/${plakatIndex}.png`;
    plakatImage.src = plakatSrc;
    plakatImage.style.display = 'block';
    plakatInfo.textContent = `Показывается: ${plakatIndex}.png (осталось в плейлисте: ${plakatPlaylist.length})`;
    
    console.log(`Показываю плакат: ${plakatIndex}.png. В плейлисте плакатов осталось: ${plakatPlaylist.length}`);
}

// Функция для запуска автоматической смены плакатов
function startPlakatRotation() {
    // Показываем первый плакат сразу
    showNextPlakat();
    
    // Устанавливаем таймер для смены плакатов каждые 5 секунд
    plakatTimer = setInterval(showNextPlakat, plakatChangeInterval);
}

// Функция для остановки смены плакатов
function stopPlakatRotation() {
    if (plakatTimer) {
        clearInterval(plakatTimer);
        plakatTimer = null;
    }
    plakatImage.style.display = 'none';
    plakatInfo.textContent = 'Плакаты будут показываться во время воспроизведения';
}

// Функция для проигрывания следующего звука из плейлиста
function playNextSoundInOrder() {
    // Шаг 1: Проверяем, не закончился ли наш плейлист.
    if (playlist.length === 0) {
        console.log("Плейлист закончился. Создаю и перемешиваю новый.");
        let newPlaylist = createOriginalPlaylist();
        shufflePlaylist(newPlaylist);
        playlist = newPlaylist;
    }

    // Шаг 2: Берем следующий звук из плейлиста.
    const soundIndex = playlist.pop();

    // Шаг 3: Проигрываем этот звук.
    console.log(`Играет звук: ${soundIndex}.mp3. В плейлисте осталось: ${playlist.length}`);
    const soundSrc = `sounds/${soundIndex}.mp3`;
    audioPlayer.src = soundSrc;

    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            playButton.textContent = `🎶 Играет: ${soundIndex}.mp3`;
            
            // Запускаем смену плакатов, если еще не запущена
            if (!plakatTimer) {
                startPlakatRotation();
            }
        })
        .catch(error => {
            console.error("Ошибка воспроизведения:", error);
            isPlaying = false;
            playButton.textContent = '▶️ Запустить';
            stopPlakatRotation();
        });
}

// Что делать, когда пользователь нажимает на кнопку
playButton.addEventListener('click', () => {
    // Если уже играет, останавливаем
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        playButton.textContent = '▶️ Запустить';
        stopPlakatRotation();
        return;
    }

    // Запускаем проигрывание
    playNextSoundInOrder();
});

// Это самая важная часть: когда один звук заканчивается, запускаем следующий
audioPlayer.addEventListener('ended', () => {
    // Просто вызываем ту же функцию для проигрывания следующего трека
    playNextSoundInOrder();
});

// Обработка ошибок загрузки аудио
audioPlayer.addEventListener('error', () => {
    console.error("Ошибка загрузки аудио файла");
    isPlaying = false;
    playButton.textContent = '▶️ Запустить';
    stopPlakatRotation();
});

// Инициализация плейлиста плакатов при загрузке страницы
window.addEventListener('load', () => {
    let initialPlakatPlaylist = createPlakatPlaylist();
    shufflePlaylist(initialPlakatPlaylist);
    plakatPlaylist = initialPlakatPlaylist;
});

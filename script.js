// --- НАСТРОЙКА ---
const totalSounds = 100;
// --- КОНЕЦ НАСТРОЙКИ ---

// Получаем доступ к элементам на странице
const playButton = document.getElementById('playButton');
const audioPlayer = document.getElementById('audioPlayer');

// Массив для хранения нашего перемешанного плейлиста
let playlist = [];
// Переменная для отслеживания состояния (играет или нет)
let isPlaying = false;


// Функция для создания массива чисел от 1 до totalSounds
function createOriginalPlaylist() {
    // Array.from создает массив, а второй аргумент заполняет его числами от 1 до totalSounds
    return Array.from({ length: totalSounds }, (_, i) => i + 1);
}

// Гарантирует качественное и равномерное перемешивание
function shufflePlaylist(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
        })
        .catch(error => {
            console.error("Ошибка воспроизведения:", error);
            isPlaying = false;
            playButton.textContent = '▶️ Запустить';
        });
}


// Что делать, когда пользователь нажимает на кнопку
playButton.addEventListener('click', () => {
    // Если уже играет, ничего не делаем
    if (isPlaying) return;

    // Запускаем проигрывание
    playNextSoundInOrder();
});

// Это самая важная часть: когда один звук заканчивается, запускаем следующий
audioPlayer.addEventListener('ended', () => {
    // Просто вызываем ту же функцию для проигрывания следующего трека
    playNextSoundInOrder();
});

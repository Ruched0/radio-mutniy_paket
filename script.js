// === КОНФИГУРАЦИЯ ===
const CONFIG = {
    totalSounds: 110,
    totalPlakats: 127,
    plakatChangeInterval: 5000, // 5 секунд
    progressUpdateInterval: 100, // 100мс для плавного обновления
    fadeTransitionTime: 500 // 500мс для анимаций
};

// === ЭЛЕМЕНТЫ DOM ===
const elements = {
    playButton: document.getElementById('playButton'),
    pauseButton: document.getElementById('pauseButton'),
    nextButton: document.getElementById('nextButton'),
    audioPlayer: document.getElementById('audioPlayer'),
    plakatImage: document.getElementById('plakatImage'),
    plakatInfo: document.getElementById('plakatInfo'),
    plakatPlaceholder: document.getElementById('plakatPlaceholder'),
    currentTrack: document.getElementById('currentTrack'),
    trackTime: document.getElementById('trackTime'),
    trackProgress: document.getElementById('trackProgress'),
    remainingTracks: document.getElementById('remainingTracks'),
    remainingPlakats: document.getElementById('remainingPlakats'),
    playedTracks: document.getElementById('playedTracks')
};

// === СОСТОЯНИЕ ПРИЛОЖЕНИЯ ===
const state = {
    playlist: [],
    plakatPlaylist: [],
    isPlaying: false,
    isPaused: false,
    playedCount: 0,
    currentSoundIndex: null,
    plakatTimer: null,
    progressTimer: null
};

// === УТИЛИТЫ ===
const utils = {
    // Создание плейлиста звуков
    createSoundPlaylist() {
        return Array.from({ length: CONFIG.totalSounds }, (_, i) => i + 1);
    },

    // Создание плейлиста плакатов
    createPlakatPlaylist() {
        return Array.from({ length: CONFIG.totalPlakats }, (_, i) => i + 1);
    },

    // Перемешивание массива (алгоритм Фишера-Йетса)
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Форматирование времени в MM:SS
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Создание нового плейлиста когда текущий закончился
    regeneratePlaylist(type = 'sound') {
        if (type === 'sound') {
            const newPlaylist = this.createSoundPlaylist();
            return this.shuffleArray(newPlaylist);
        } else {
            const newPlaylist = this.createPlakatPlaylist();
            return this.shuffleArray(newPlaylist);
        }
    },

    // Безопасное обновление текстового содержимого
    updateText(element, text) {
        if (element) {
            element.textContent = text;
        }
    },

    // Логирование с временной меткой
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
    }
};

// === УПРАВЛЕНИЕ ПЛАКАТАМИ ===
const plakatManager = {
    show(plakatIndex) {
        const plakatSrc = `${plakatIndex}.png`;
        
        // Предзагрузка изображения для плавной смены
        const img = new Image();
        img.onload = () => {
            elements.plakatImage.src = plakatSrc;
            elements.plakatImage.style.display = 'block';
            elements.plakatPlaceholder.style.display = 'none';
        };
        img.onerror = () => {
            utils.log(`Ошибка загрузки плаката: ${plakatSrc}`);
        };
        img.src = plakatSrc;

        utils.updateText(elements.plakatInfo, 
            `Показывается: ${plakatIndex}.png (осталось плакатов: ${state.plakatPlaylist.length})`);
        
        utils.log(`Показываю плакат: ${plakatIndex}.png`);
    },

    showNext() {
        // Проверяем, не закончился ли плейлист плакатов
        if (state.plakatPlaylist.length === 0) {
            utils.log("Плейлист плакатов закончился. Создаю новый.");
            state.plakatPlaylist = utils.regeneratePlaylist('plakat');
        }

        const plakatIndex = state.plakatPlaylist.pop();
        this.show(plakatIndex);
        uiManager.updateCounters();
    },

    hide() {
        elements.plakatImage.style.display = 'none';
        elements.plakatPlaceholder.style.display = 'block';
        utils.updateText(elements.plakatInfo, 
            'Плакаты будут показываться каждые 5 секунд во время воспроизведения');
    },

    startRotation() {
        if (state.plakatTimer) return; // Уже запущено
        
        this.showNext(); // Показываем первый плакат сразу
        state.plakatTimer = setInterval(() => {
            this.showNext();
        }, CONFIG.plakatChangeInterval);
        
        utils.log('Запущена ротация плакатов');
    },

    stopRotation() {
        if (state.plakatTimer) {
            clearInterval(state.plakatTimer);
            state.plakatTimer = null;
            utils.log('Остановлена ротация плакатов');
        }
        this.hide();
    }
};

// === УПРАВЛЕНИЕ АУДИО ===
const audioManager = {
    updateProgress() {
        const audio = elements.audioPlayer;
        if (audio.duration && state.isPlaying && !state.isPaused) {
            const progress = (audio.currentTime / audio.duration) * 100;
            elements.trackProgress.style.width = `${Math.min(progress, 100)}%`;
            
            const current = utils.formatTime(audio.currentTime);
            const duration = utils.formatTime(audio.duration);
            utils.updateText(elements.trackTime, `${current} / ${duration}`);
        }
    },

    startProgressUpdate() {
        if (state.progressTimer) return; // Уже запущено
        
        state.progressTimer = setInterval(() => {
            this.updateProgress();
        }, CONFIG.progressUpdateInterval);
    },

    stopProgressUpdate() {
        if (state.progressTimer) {
            clearInterval(state.progressTimer);
            state.progressTimer = null;
        }
    },

    async playSound(soundIndex) {
        const soundSrc = `sounds/${soundIndex}.mp3`;
        const audio = elements.audioPlayer;
        
        audio.src = soundSrc;
        state.currentSoundIndex = soundIndex;

        try {
            await audio.play();
            
            state.isPlaying = true;
            state.isPaused = false;
            state.playedCount++;
            
            utils.updateText(elements.currentTrack, `🎵 ${soundIndex}.mp3`);
            uiManager.showPlayingState();
            uiManager.updateCounters();
            
            // Запускаем обновления
            this.startProgressUpdate();
            plakatManager.startRotation();
            
            utils.log(`Воспроизводится: ${soundIndex}.mp3`);
            
        } catch (error) {
            utils.log(`Ошибка воспроизведения ${soundIndex}.mp3: ${error.message}`);
            this.handlePlaybackError();
        }
    },

    playNext() {
        // Проверяем, не закончился ли плейлист
        if (state.playlist.length === 0) {
            utils.log("Плейлист звуков закончился. Создаю новый.");
            state.playlist = utils.regeneratePlaylist('sound');
        }

        const soundIndex = state.playlist.pop();
        this.playSound(soundIndex);
    },

    pause() {
        if (state.isPlaying) {
            elements.audioPlayer.pause();
            state.isPlaying = false;
            state.isPaused = true;
            
            this.stopProgressUpdate();
            plakatManager.stopRotation();
            uiManager.showPausedState();
            
            utils.log('Воспроизведение приостановлено');
        }
    },

    resume() {
        if (state.isPaused) {
            elements.audioPlayer.play()
                .then(() => {
                    state.isPlaying = true;
                    state.isPaused = false;
                    
                    this.startProgressUpdate();
                    plakatManager.startRotation();
                    uiManager.showPlayingState();
                    
                    utils.log('Воспроизведение возобновлено');
                })
                .catch(error => {
                    utils.log(`Ошибка возобновления: ${error.message}`);
                    this.handlePlaybackError();
                });
        }
    },

    stop() {
        elements.audioPlayer.pause();
        elements.audioPlayer.currentTime = 0;
        
        state.isPlaying = false;
        state.isPaused = false;
        state.currentSoundIndex = null;
        
        this.stopProgressUpdate();
        plakatManager.stopRotation();
        uiManager.showIdleState();
        
        utils.log('Воспроизведение остановлено');
    },

    handlePlaybackError() {
        this.stop();
        utils.updateText(elements.currentTrack, 'Ошибка воспроизведения');
        
        // Автоматически пробуем следующий трек через 2 секунды
        setTimeout(() => {
            if (!state.isPlaying) {
                this.playNext();
            }
        }, 2000);
    }
};

// === УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ===
const uiManager = {
    updateCounters() {
        utils.updateText(elements.remainingTracks, state.playlist.length.toString());
        utils.updateText(elements.remainingPlakats, state.plakatPlaylist.length.toString());
        utils.updateText(elements.playedTracks, state.playedCount.toString());
    },

    showIdleState() {
        elements.playButton.style.display = 'inline-flex';
        elements.pauseButton.style.display = 'none';
        
        utils.updateText(elements.currentTrack, 'Готов к воспроизведению');
        elements.trackProgress.style.width = '0%';
        utils.updateText(elements.trackTime, '0:00 / 0:00');
        
        // Обновляем текст кнопки
        elements.playButton.querySelector('.button-text').textContent = 'Запустить';
    },

    showPlayingState() {
        elements.playButton.style.display = 'none';
        elements.pauseButton.style.display = 'inline-flex';
    },

    showPausedState() {
        elements.playButton.style.display = 'inline-flex';
        elements.pauseButton.style.display = 'none';
        
        // Обновляем текст кнопки для возобновления
        elements.playButton.querySelector('.button-text').textContent = 'Продолжить';
    },

    // Добавление визуальной обратной связи для кнопок
    addButtonFeedback() {
        const buttons = [elements.playButton, elements.pauseButton, elements.nextButton];
        
        buttons.forEach(button => {
            if (!button) return;
            
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = '';
            });
            
            button.addEventListener('touchcancel', () => {
                button.style.transform = '';
            });
        });
    },

    // Инициализация значений при загрузке
    initializeUI() {
        utils.updateText(elements.totalTracks, CONFIG.totalSounds.toString());
        utils.updateText(elements.totalPlakatsCount, CONFIG.totalPlakats.toString());
        this.updateCounters();
        this.showIdleState();
        this.addButtonFeedback();
    }
};

// === ОБРАБОТЧИКИ СОБЫТИЙ ===
const eventHandlers = {
    setupAudioEvents() {
        const audio = elements.audioPlayer;

        // Трек закончился - играем следующий
        audio.addEventListener('ended', () => {
            utils.log('Трек закончился, переключаюсь на следующий');
            audioManager.playNext();
        });

        // Ошибка загрузки
        audio.addEventListener('error', (e) => {
            utils.log(`Ошибка аудио: ${e.message || 'Неизвестная ошибка'}`);
            audioManager.handlePlaybackError();
        });

        // Метаданные загружены
        audio.addEventListener('loadedmetadata', () => {
            audioManager.updateProgress();
        });

        // Обновление времени воспроизведения
        audio.addEventListener('timeupdate', () => {
            if (state.isPlaying && !state.isPaused) {
                audioManager.updateProgress();
            }
        });

        // Можно начать воспроизведение
        audio.addEventListener('canplay', () => {
            utils.log('Аудио готово к воспроизведению');
        });
    },

    setupButtonEvents() {
        // Кнопка Play/Resume
        elements.playButton?.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (state.isPaused) {
                audioManager.resume();
            } else if (!state.isPlaying) {
                audioManager.playNext();
            }
        });

        // Кнопка Pause
        elements.pauseButton?.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.pause();
        });

        // Кнопка Next
        elements.nextButton?.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (state.isPlaying || state.isPaused) {
                audioManager.playNext();
            }
        });
    },

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Предотвращаем обработку если фокус на input элементе
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (state.isPlaying) {
                        audioManager.pause();
                    } else if (state.isPaused) {
                        audioManager.resume();
                    } else {
                        audioManager.playNext();
                    }
                    break;
                    
                case 'ArrowRight':
                case 'KeyN':
                    e.preventDefault();
                    if (state.isPlaying || state.isPaused) {
                        audioManager.playNext();
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    audioManager.stop();
                    break;
            }
        });
    },

    // Обработка видимости страницы (Page Visibility API)
    setupVisibilityEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Страница скрыта - можем приостановить некритичные операции
                utils.log('Страница скрыта');
            } else {
                // Страница видима - возобновляем операции
                utils.log('Страница видима');
                if (state.isPlaying) {
                    audioManager.startProgressUpdate();
                }
            }
        });
    }
};

// === ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ===
const app = {
    init() {
        utils.log('Инициализация приложения...');
        
        // Проверяем наличие необходимых элементов
        if (!this.checkRequiredElements()) {
            utils.log('ОШИБКА: Не найдены необходимые элементы DOM');
            return;
        }

        // Создаем начальные плейлисты
        state.playlist = utils.shuffleArray(utils.createSoundPlaylist());
        state.plakatPlaylist = utils.shuffleArray(utils.createPlakatPlaylist());

        // Настраиваем интерфейс
        uiManager.initializeUI();

        // Настраиваем обработчики событий
        eventHandlers.setupAudioEvents();
        eventHandlers.setupButtonEvents();
        eventHandlers.setupKeyboardEvents();
        eventHandlers.setupVisibilityEvents();

        // Предотвращаем автозапуск на мобильных устройствах
        elements.audioPlayer.preload = 'none';

        utils.log('Приложение успешно инициализировано');
        utils.log(`Загружено треков: ${CONFIG.totalSounds}, плакатов: ${CONFIG.totalPlakats}`);
    },

    checkRequiredElements() {
        const required = [
            'playButton', 'pauseButton', 'nextButton', 'audioPlayer',
            'currentTrack', 'trackProgress', 'remainingTracks', 'remainingPlakats'
        ];

        return required.every(elementId => {
            const element = elements[elementId];
            if (!element) {
                console.error(`Элемент ${elementId} не найден`);
                return false;
            }
            return true;
        });
    },

    // Метод для отладки состояния
    getDebugInfo() {
        return {
            state: { ...state },
            playlistLength: state.playlist.length,
            plakatPlaylistLength: state.plakatPlaylist.length,
            audioSrc: elements.audioPlayer.src,
            audioDuration: elements.audioPlayer.duration,
            audioCurrentTime: elements.audioPlayer.currentTime
        };
    }
};

// === ЗАПУСК ПРИЛОЖЕНИЯ ===
// Ждем полной загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    // DOM уже загружен
    app.init();
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ОТЛАДКИ ===
// Доступны в консоли браузера для отладки
window.radioDebug = {
    getState: () => app.getDebugInfo(),
    playNext: () => audioManager.playNext(),
    pause: () => audioManager.pause(),
    resume: () => audioManager.resume(),
    stop: () => audioManager.stop(),
    showPlakat: () => plakatManager.showNext(),
    regeneratePlaylist: () => {
        state.playlist = utils.shuffleArray(utils.createSoundPlaylist());
        uiManager.updateCounters();
        utils.log('Плейлист пересоздан');
    }
};

// === ОБРАБОТКА ОШИБОК ===
window.addEventListener('error', (e) => {
    utils.log(`Глобальная ошибка: ${e.message}`);
});

window.addEventListener('unhandledrejection', (e) => {
    utils.log(`Необработанное отклонение промиса: ${e.reason}`);
});

utils.log('Скрипт загружен успешно');

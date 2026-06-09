// ===== BAZA DANYCH GRAMATYKI =====
const grammarPoints = [
    { id: 0, name: "です / じゃないです", pattern: "[Rzeczownik] + です / じゃないです", unlocked: true, completed: false, dependencies: [] },
    { id: 1, name: "〜ます / 〜ません", pattern: "[Czasownik] + ます / ません", unlocked: true, completed: false, dependencies: [] },
    { id: 2, name: "て-form (łącznik)", pattern: "[Czasownik-te] + ...", unlocked: true, completed: false, dependencies: [0,1] },
    { id: 3, name: "〜てください", pattern: "[Te-form] + ください", unlocked: false, completed: false, dependencies: [2] },
    { id: 4, name: "〜たい / 〜たくない", pattern: "[Masu-stem] + たい / たくない", unlocked: false, completed: false, dependencies: [1] },
    { id: 5, name: "〜に行く (cel)", pattern: "[Rzeczownik] + に + 行く", unlocked: false, completed: false, dependencies: [0,1] },
    { id: 6, name: "〜たことがあります", pattern: "[Ta-form] + ことがある", unlocked: false, completed: false, dependencies: [2] },
    { id: 7, name: "〜すぎる", pattern: "[Masu-stem] + すぎる", unlocked: false, completed: false, dependencies: [1] }
];

// Stan użytkownika (zapis w localStorage)
let userProgress = JSON.parse(localStorage.getItem('grammi_progress')) || {
    completed: [],
    mistakes: {}
};

// Inicjalizacja
function init() {
    updateUnlocks();
    renderGrammarTree();
    updateStats();
    attachEventListeners();
    updateProgressBar();
}

// Odblokowywanie lekcji na podstawie ukończonych
function updateUnlocks() {
    grammarPoints.forEach(point => {
        if (userProgress.completed.includes(point.id)) {
            point.completed = true;
            point.unlocked = true;
        } else {
            // Sprawdź czy wszystkie dependencje są ukończone
            const depsCompleted = point.dependencies.every(depId => userProgress.completed.includes(depId));
            point.unlocked = depsCompleted && (point.dependencies.length === 0 || userProgress.completed.length > 0);
        }
    });
}

// Renderowanie drzewa gramatyki
function renderGrammarTree() {
    const container = document.getElementById('grammarTree');
    container.innerHTML = '';
    
    grammarPoints.forEach(point => {
        const node = document.createElement('div');
        node.className = `grammar-node ${point.completed ? 'completed' : ''} ${!point.unlocked ? 'locked' : ''}`;
        if (point.unlocked && !point.completed) {
            node.style.cursor = 'pointer';
            node.onclick = () => openLesson(point.id);
        } else if (!point.unlocked) {
            node.onclick = null;
        }
        
        node.innerHTML = `
            <div class="node-title">${point.name}</div>
            <div class="node-pattern">${point.pattern}</div>
            ${point.completed ? '<div style="color:#00C853; margin-top:8px;">✓ Ukończone</div>' : ''}
            ${!point.unlocked && !point.completed ? '<div style="color:#888; margin-top:8px;">🔒 Odblokuj poprzednie lekcje</div>' : ''}
        `;
        container.appendChild(node);
    });
}

// Otwieranie lekcji (symulacja)
function openLesson(id) {
    const lesson = grammarPoints[id];
    if (!lesson.unlocked) return;
    
    const answer = confirm(`📖 Lekcja: ${lesson.name}\n\nWzór: ${lesson.pattern}\n\nPrzykład:\n・${getExampleForLesson(id)}\n\nCzy opanowałaś/eś tę konstrukcję? (Kliknij OK jeśli TAK)`);
    
    if (answer) {
        if (!userProgress.completed.includes(id)) {
            userProgress.completed.push(id);
            saveProgress();
            updateUnlocks();
            renderGrammarTree();
            updateStats();
            updateProgressBar();
            alert(`🎉 Gratulacje! Opanowałaś/eś ${lesson.name}! Odblokowano nowe lekcje.`);
        }
    }
}

// Przykłady do lekcji
function getExampleForLesson(id) {
    const examples = {
        0: "学生です (Jestem studentem) / 学生じゃないです (Nie jestem studentem)",
        1: "食べます (Jem) / 食べません (Nie jem)",
        2: "食べて (jedząc / i jeść)",
        3: "食べてください (Proszę jeść)",
        4: "食べたい (Chcę zjeść) / 食べたくない (Nie chcę jeść)",
        5: "買い物に行く (Idę na zakupy)",
        6: "日本に行ったことがあります (Byłam/em w Japonii)",
        7: "食べすぎる (Jeść za dużo)"
    };
    return examples[id] || "Przykładowe zdanie z tą konstrukcją.";
}

// Statystyki
function updateStats() {
    const total = grammarPoints.length;
    const completedCount = userProgress.completed.length;
    const percent = Math.round((completedCount / total) * 100);
    document.getElementById('progressPercent').innerText = `${percent}%`;
    
    // Lista supermocy (ukończone)
    const superList = document.getElementById('superpowersList');
    superList.innerHTML = userProgress.completed.map(id => 
        `<li>✓ ${grammarPoints.find(p => p.id === id)?.name}</li>`
    ).join('');
    if (userProgress.completed.length === 0) superList.innerHTML = '<li>✨ Ukończ pierwszą lekcję!</li>';
    
    // Lista potworów (odblokowane ale nieukończone)
    const monsters = grammarPoints.filter(p => p.unlocked && !p.completed);
    const monsterList = document.getElementById('monstersList');
    monsterList.innerHTML = monsters.map(p => 
        `<li>👹 ${p.name}</li>`
    ).join('');
    if (monsters.length === 0) monsterList.innerHTML = '<li>🎉 Wszystkie pokonane!</li>';
    
    // Prosty wykres (canvas)
    const canvas = document.getElementById('progressChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF2D5E';
        ctx.fillRect(0, 0, (percent / 100) * canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Inter';
        ctx.fillText(`${percent}%`, 10, 20);
    }
}

function updateProgressBar() {
    const percent = Math.round((userProgress.completed.length / grammarPoints.length) * 100);
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// Szybkie strzały
let quickFireActive = false;
let quickFireTimer;

function startQuickFire() {
    const unlockedUncompleted = grammarPoints.filter(p => p.unlocked && !p.completed);
    const pool = unlockedUncompleted.length ? unlockedUncompleted : grammarPoints;
    const random = pool[Math.floor(Math.random() * pool.length)];
    
    const question = `Jak brzmi wzór konstrukcji "${random.name}"?`;
    document.getElementById('quickFireQuestion').innerText = question;
    document.getElementById('quickFireAnswer').value = '';
    document.getElementById('quickFireModal').classList.remove('hidden');
    
    let timeLeft = 10;
    const timerEl = document.getElementById('timer');
    timerEl.innerText = `${timeLeft}s`;
    
    if (quickFireTimer) clearInterval(quickFireTimer);
    quickFireTimer = setInterval(() => {
        timeLeft--;
        timerEl.innerText = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(quickFireTimer);
            alert('⏰ Czas minął! Spróbuj ponownie.');
            document.getElementById('quickFireModal').classList.add('hidden');
        }
    }, 1000);
    
    window.currentQuickFirePoint = random;
}

// Skaner gramatyczny
function scanGrammar() {
    const input = document.getElementById('japaneseInput').value;
    if (!input.trim()) {
        document.getElementById('scanResult').innerHTML = 'Wpisz japońskie zdanie.';
        return;
    }
    
    let result = `<strong>Analiza gramatyczna:</strong><br><br>`;
    let found = false;
    
    for (const point of grammarPoints) {
        if (input.includes('たい') && point.id === 4) {
            result += `✅ **${point.name}**: wyraża chęć wykonania czynności<br>`;
            found = true;
        }
        if (input.includes('すぎ') && point.id === 7) {
            result += `✅ **${point.name}**: znaczy "za dużo" / "zbyt"<br>`;
            found = true;
        }
        if (input.includes('てください') && point.id === 3) {
            result += `✅ **${point.name}**: grzeczna prośba "proszę..."<br>`;
            found = true;
        }
        if (input.includes('たことが') && point.id === 6) {
            result += `✅ **${point.name}**: doświadczenie "kiedyś coś zrobiłem/am"<br>`;
            found = true;
        }
        if ((input.includes('です') || input.includes('じゃない')) && point.id === 0) {
            result += `✅ **${point.name}**: zdania z rzeczownikami/przymiotnikami な<br>`;
            found = true;
        }
    }
    
    if (!found) {
        result += '⚠️ Nie wykryto znanych konstrukcji. Spróbuj: "食べたい" lub "食べてください"';
    }
    
    document.getElementById('scanResult').innerHTML = result;
}

// Zapis i eventy
function saveProgress() {
    localStorage.setItem('grammi_progress', JSON.stringify(userProgress));
}

function attachEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab + 'Tab';
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    document.getElementById('speedrunBtn')?.addEventListener('click', () => {
        alert('⚡ Tryb Speedrun N5: Ukończ wszystkie lekcje w kolejności! Twoje postępy są automatycznie zapisywane.');
    });
    
    document.getElementById('quickFireBtn')?.addEventListener('click', startQuickFire);
    document.getElementById('quickFireSubmit')?.addEventListener('click', () => {
        clearInterval(quickFireTimer);
        const answer = document.getElementById('quickFireAnswer').value;
        const correctPattern = window.currentQuickFirePoint?.pattern;
        if (answer.toLowerCase().includes(correctPattern?.toLowerCase() || '')) {
            alert('✅ Dobra odpowiedź! +1 do automatyzmu.');
        } else {
            alert(`❌ Poprawny wzór: ${correctPattern}. Zapamiętaj go!`);
            // Zapisanie błędu (symulacja triage)
            if (!userProgress.mistakes[window.currentQuickFirePoint?.id]) userProgress.mistakes[window.currentQuickFirePoint?.id] = 0;
            userProgress.mistakes[window.currentQuickFirePoint?.id]++;
            saveProgress();
        }
        document.getElementById('quickFireModal').classList.add('hidden');
    });
    
    document.getElementById('quickFireClose')?.addEventListener('click', () => {
        clearInterval(quickFireTimer);
        document.getElementById('quickFireModal').classList.add('hidden');
    });
    
    document.getElementById('scanBtn')?.addEventListener('click', scanGrammar);
}

// Start
init();

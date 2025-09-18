// Constantes y elementos del DOM
const VIDSRC_BASE_URL = "https://vidsrc.to/embed/";
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const videoFrame = document.getElementById("videoFrame");
const loader = document.getElementById("loader");
const contentTypeSelect = document.getElementById("contentType");
const videoIdInput = document.getElementById("videoId");
const seriesControls = document.getElementById("series-controls");
const seasonInput = document.getElementById("season");
const episodeInput = document.getElementById("episode");
const playButton = document.getElementById("playButton");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const themeSwitcher = document.getElementById("themeSwitcher");
const apiKeyInput = document.getElementById("apiKey");

let history = JSON.parse(localStorage.getItem("playbackHistory")) || [];
let apiKey = localStorage.getItem("tmdbApiKey") || "";
apiKeyInput.value = apiKey;

// Función para mostrar u ocultar el loader
function showLoader(show) {
    loader.classList.toggle("hidden", !show);
    videoFrame.style.visibility = show ? "hidden" : "visible";
}

// Función para obtener el título de TMDb
async function getTitle(id, type, apiKey) {
    if (!apiKey || !id) return null;
    const endpoint = type === 'series' ? 'tv' : 'movie';
    try {
        const response = await fetch(`${TMDB_API_BASE_URL}/${endpoint}/${id}?api_key=${apiKey}&language=es-ES`);
        if (!response.ok) throw new Error('Error al obtener el título');
        const data = await response.json();
        return data.title || data.name;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Función para actualizar la URL del iframe y guardar en el historial
async function playVideo(videoData) {
    const { id, type, season, episode } = videoData;

    if (!id) {
        alert("ID de contenido inválido.");
        return;
    }

    showLoader(true);

    let url;
    if (type === "movie") {
        url = `${VIDSRC_BASE_URL}movie/${id}`;
    } else {
        url = `${VIDSRC_BASE_URL}tv/${id}/${season}/${episode}`;
    }

    videoFrame.src = url;

    // Actualizar campos de entrada
    videoIdInput.value = id;
    contentTypeSelect.value = type;
    if (type === "series") {
        seasonInput.value = season;
        episodeInput.value = episode;
    }
    toggleSeriesControls();

    const title = await getTitle(id, type, apiKey);
    saveToHistory({ ...videoData, title });
}

// Función para guardar en el historial
function saveToHistory(videoData) {
    history = history.filter(item => item.id !== videoData.id || item.type !== videoData.type);
    history.unshift(videoData);
    if (history.length > 20) history.pop();

    localStorage.setItem("playbackHistory", JSON.stringify(history));
    renderHistory();
}

// Función para renderizar el historial
function renderHistory() {
    historyList.innerHTML = "";
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No hay historial de reproducción.</p>';
        return;
    }

    history.forEach((item, index) => {
        const li = document.createElement("li");
        const title = item.title ? `${item.title} (${item.id})` : item.id;
        li.innerHTML = `
            <div class="item-info" onclick="playVideo(history[${index}])">
                <div class="info">${title}</div>
                <div class="details">${item.type === 'series' ? `T${item.season} E${item.episode}` : 'Película'}</div>
            </div>
            <button class="delete-history-item" onclick="deleteHistoryItem(${index}, event)"><i class="fas fa-trash-alt"></i></button>
        `;
        historyList.appendChild(li);
    });
}

// Función para eliminar un elemento del historial
function deleteHistoryItem(index, event) {
    event.stopPropagation(); // Evita que se dispare el evento de play
    history.splice(index, 1);
    localStorage.setItem("playbackHistory", JSON.stringify(history));
    renderHistory();
}

// Función para limpiar el historial
function clearHistory() {
    if (confirm("¿Estás seguro de que quieres limpiar el historial?")) {
        history = [];
        localStorage.removeItem("playbackHistory");
        renderHistory();
    }
}

// Función para mostrar/ocultar los controles de serie
function toggleSeriesControls() {
    seriesControls.style.display = contentTypeSelect.value === "series" ? "contents" : "none";
}

// Función para cambiar el tema
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    updateThemeIcon(isLight);
}

// Función para actualizar el ícono del tema
function updateThemeIcon(isLight) {
    themeSwitcher.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// Función para cargar el tema guardado
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    const isLight = savedTheme === "light";
    if (isLight) document.body.classList.add("light-mode");
    updateThemeIcon(isLight);
}

// Event Listeners
playButton.addEventListener("click", () => {
    const videoData = {
        id: videoIdInput.value.trim(),
        type: contentTypeSelect.value,
        season: seasonInput.value || 1,
        episode: episodeInput.value || 1,
    };
    playVideo(videoData);
});

apiKeyInput.addEventListener("change", () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem("tmdbApiKey", apiKey);
    alert("API Key de TMDb guardada.");
});

clearHistoryButton.addEventListener("click", clearHistory);
contentTypeSelect.addEventListener("change", toggleSeriesControls);
themeSwitcher.addEventListener("click", toggleTheme);

videoFrame.addEventListener("load", () => showLoader(false));

// Carga inicial
window.onload = () => {
    loadTheme();
    toggleSeriesControls();
    renderHistory();
    showLoader(false);

    // Tizen back button functionality
    window.addEventListener('tizenhwkey', function(ev) {
        if (ev.keyName === 'back') {
            var activeEl = document.activeElement;
            if (activeEl && activeEl.tagName !== 'BODY') {
                activeEl.blur();
            } else {
                tizen.application.getCurrentApplication().exit();
            }
        }
    });
};
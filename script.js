const API_KEY = "84561f39";

const searchInput = document.getElementById("searchInput");
const movieGrid = document.getElementById("movieGrid");
const loading = document.getElementById("loading");
const emptySearch = document.getElementById("emptySearch");
const resultsTitle= document.getElementById("resultsTitle");
const watchlistItems = document.getElementById("watchlistItems");
const emptyWatchlist= document.getElementById("emptyWatchlist");
const randomBtn = document.getElementById("randomBtn");

let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

let debounceTimer;

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();

  if (!query) {
    movieGrid.innerHTML = "";
    emptySearch.classList.add("hidden");
    loading.classList.add("hidden");
    resultsTitle.textContent = "Search for a movie to get started";
    return;
  }

  debounceTimer = setTimeout(() => searchMovies(query), 400);
});


async function searchMovies(query) {
  loading.classList.remove("hidden");
  movieGrid.innerHTML = "";
  emptySearch.classList.add("hidden");
  resultsTitle.textContent = `Results for "${query}"`;

  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
    const data = await res.json();

    loading.classList.add("hidden");

    if (data.Response === "False") {
      emptySearch.classList.remove("hidden");
      return;
    }

    renderMovies(data.Search);
  } catch (err) {
    loading.classList.add("hidden");
    movieGrid.innerHTML = `<p class="empty-state">Something went wrong. Please try again.</p>`;
  }
}

function renderMovies(movies) {
  movieGrid.innerHTML = movies.map((movie) => {
    const inList = watchlist.some((w) => w.imdbID === movie.imdbID);
    const poster = movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/160x240/1a1a1a/555?text=No+Image";

    return `
      <div class="card">
        <img src="${poster}" alt="${movie.Title}" />
        <div class="card-info">
          <h3 title="${movie.Title}">${movie.Title}</h3>
          <p>${movie.Year} · ${movie.Type}</p>
          <button
            class="${inList ? "remove" : ""}"
            onclick="toggleWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}')">
            ${inList ? "- Remove" : "+ Add to Watchlist"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function toggleWatchlist(id, title) {
  const exists = watchlist.find((w) => w.imdbID === id);

  if (exists) {
    watchlist = watchlist.filter((w) => w.imdbID !== id);
  } else {
    watchlist.push({ imdbID: id, Title: title });
  }

  localStorage.setItem("watchlist", JSON.stringify(watchlist));

  renderWatchlist();

  const query = searchInput.value.trim();
  if (query) searchMovies(query);
}

function renderWatchlist() {
  if (watchlist.length === 0) {
    watchlistItems.innerHTML = `<p id="emptyWatchlist" class="empty-state">Your watchlist is empty. Start searching!</p>`;
    randomBtn.classList.add("hidden");
    return;
  }

  watchlistItems.innerHTML = watchlist.map((movie) => `
    <div class="watch-item">
      <span>${movie.Title}</span>
      <button onclick="toggleWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}')">✕</button>
    </div>
  `).join("");

  randomBtn.classList.remove("hidden");
}

randomBtn.addEventListener("click", () => {
  if (watchlist.length === 0) return;
  const pick = watchlist[Math.floor(Math.random() * watchlist.length)];
  alert(`🎬 Watch tonight: "${pick.Title}"`);
});

renderWatchlist();
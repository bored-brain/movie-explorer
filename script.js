const API_KEY = "84561f39";

const TRENDING_QUERIES  = ["avengers", "batman", "spider-man", "inception", "joker"];
const TOP_RATED_QUERIES = ["godfather", "schindler", "dark knight", "forrest gump", "interstellar"];

const searchBtn     = document.getElementById("searchBtn");
const closeSearch   = document.getElementById("closeSearch");
const searchModal   = document.getElementById("searchModal");
const searchInput   = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const trendingRow   = document.getElementById("trendingRow");
const topRatedRow   = document.getElementById("topRatedRow");
const favsRow       = document.getElementById("favsRow");

let favourites = JSON.parse(localStorage.getItem("movieFavs")) || [];



searchBtn.addEventListener("click", () => {
  searchModal.classList.add("active");
  searchInput.focus();
});

closeSearch.addEventListener("click", closeModal);

searchModal.addEventListener("click", (e) => {
  if (e.target === searchModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function closeModal() {
  searchModal.classList.remove("active");
  searchInput.value = "";
  searchResults.innerHTML = "";
}

// ─── Live Search (debounced) ───
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  if (!query) { searchResults.innerHTML = ""; return; }
  debounceTimer = setTimeout(() => searchMovies(query), 400);
});

async function searchMovies(query) {
  searchResults.innerHTML = `<p class="search-hint">Searching...</p>`;
  try {
    const res  = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
    const data = await res.json();
    if (data.Response === "False") {
      searchResults.innerHTML = `<p class="search-hint">No results found for "<strong>${query}</strong>".</p>`;
      return;
    }
    searchResults.innerHTML = data.Search.map(movie => buildCard(movie, "search")).join("");
  } catch {
    searchResults.innerHTML = `<p class="search-hint">Something went wrong. Please try again.</p>`;
  }
}


async function loadRow(queries, container) {
  const movies = [];
  for (const q of queries) {
    try {
      const res  = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${q}&type=movie`);
      const data = await res.json();
      if (data.Response === "True") {
        movies.push(data.Search[0]);
      }
    } catch { /* skip on error */ }
  }
  container.innerHTML = movies.length
    ? movies.map(m => buildCard(m, "row")).join("")
    : `<p class="empty-favs">Could not load movies right now.</p>`;
}


function renderFavourites() {
  if (favourites.length === 0) {
    favsRow.innerHTML = `<p class="empty-favs">Add movies to your watchlist and they'll appear here.</p>`;
    return;
  }
  favsRow.innerHTML = favourites.map(m => buildCard(m, "row")).join("");
}

function toggleFav(imdbID, title, poster) {
  const exists = favourites.find(f => f.imdbID === imdbID);
  if (exists) {
    favourites = favourites.filter(f => f.imdbID !== imdbID);
  } else {
    favourites.push({ imdbID, Title: title, Poster: poster });
  }
  localStorage.setItem("movieFavs", JSON.stringify(favourites));
  renderFavourites();
  const query = searchInput.value.trim();
  if (query) searchMovies(query);
}


// card
function buildCard(movie, context) {
  const isFav   = favourites.some(f => f.imdbID === movie.imdbID);
  const poster  = movie.Poster && movie.Poster !== "N/A"
    ? movie.Poster
    : "https://placehold.co/200x300/1a1a1a/555?text=No+Image";
  const safeTitle  = (movie.Title || "").replace(/'/g, "\\'");

  if (context === "search") {
    return `
      <div class="result-card">
        <img src="${poster}" alt="${movie.Title}" />
        <div class="result-info">
          <h3>${movie.Title}</h3>
          <p>${movie.Year} · ${movie.Type || "movie"}</p>
          <button
            class="fav-btn ${isFav ? "active" : ""}"
            onclick="toggleFav('${movie.imdbID}', '${safeTitle}', '${poster}')">
            ${isFav ? "❤️ Saved" : "🤍 Save"}
          </button>
        </div>
      </div>`;
  }

// Row card (trending,top-rated,favs)
  return `
    <div class="movie-card" onclick="toggleFav('${movie.imdbID}', '${safeTitle}', '${poster}')">
      <img src="${poster}" alt="${movie.Title}" />
      <div class="card-overlay">
        <p class="card-title">${movie.Title}</p>
        <span class="card-year">${movie.Year || ""}</span>
        <span class="card-heart ${isFav ? "saved" : ""}">${isFav ? "❤️" : "🤍"}</span>
      </div>
    </div>`;
}


loadRow(TRENDING_QUERIES,  trendingRow);
loadRow(TOP_RATED_QUERIES, topRatedRow);
renderFavourites();


const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 60);
});
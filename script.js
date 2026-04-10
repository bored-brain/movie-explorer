const API_KEY = "84561f39";

const TRENDING_QUERIES = ["avengers", "batman", "spider-man", "inception", "joker", "interstellar", "matrix", "pulp fiction"];
const TOP_RATED_QUERIES = ["the godfather", "schindler's list", "the dark knight", "forrest gump", "pulp fiction", "lord of the rings"];

const searchInput = document.getElementById("searchInput");
const searchCard = document.getElementById("searchCard");
const searchCardGrid = document.getElementById("searchCardGrid");
const closeSearchCard = document.getElementById("closeSearchCard");
const trendingGrid = document.getElementById("trendingGrid");
const topRatedGrid = document.getElementById("topRatedGrid");
const vaultGrid = document.getElementById("vaultGrid");

let favourites = JSON.parse(localStorage.getItem("movieFavs")) || [];

document.addEventListener("DOMContentLoaded", () => {
    loadCategory(TRENDING_QUERIES, trendingGrid, true);
    loadCategory(TOP_RATED_QUERIES, topRatedGrid);
    renderVault();
});

let debounceTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (!query) {
        hideSearchCard();
        return;
    }
    debounceTimer = setTimeout(() => {
        showSearchCard();
        searchMovies(query);
    }, 400);
});

closeSearchCard.addEventListener("click", () => {
    hideSearchCard();
    searchInput.value = "";
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideSearchCard();
});

document.addEventListener("click", (e) => {
    if (!searchCard.contains(e.target) && e.target !== searchInput && !searchCard.classList.contains("hidden")) {
        hideSearchCard();
    }
});

function showSearchCard() {
    searchCard.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function hideSearchCard() {
    searchCard.classList.add("hidden");
    document.body.style.overflow = "auto";
}

async function fetchMovieDetails(imdbID) {
    try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`);
        return await res.json();
    } catch {
        return null;
    }
}

async function searchMovies(query) {
    searchCardGrid.innerHTML = `<div class="loading">Searching for "${query}"...</div>`;
    try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
        const data = await res.json();
        if (data.Response === "False") {
            searchCardGrid.innerHTML = `<div class="loading">No results found for "${query}".</div>`;
            return;
        }
        const detailedMovies = await Promise.all(
            data.Search.slice(0, 10).map(m => fetchMovieDetails(m.imdbID))
        );
        searchCardGrid.innerHTML = detailedMovies.filter(m => m).map(movie => buildCard(movie)).join("");
    } catch {
        searchCardGrid.innerHTML = `<div class="loading">Something went wrong. Please try again.</div>`;
    }
}

async function loadCategory(queries, gridElement, shouldSort = false) {
    let movies = [];
    for (const q of queries) {
        try {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${q}&type=movie`);
            const data = await res.json();
            if (data.Response === "True") {
                movies.push(data.Search[0]);
            }
        } catch { /* skip */ }
    }
    const detailedMovies = await Promise.all(
        movies.map(m => fetchMovieDetails(m.imdbID))
    );
    let finalMovies = detailedMovies.filter(m => m);
    if (shouldSort) {
        finalMovies.sort((a, b) => {
            const rA = a.imdbRating !== "N/A" ? parseFloat(a.imdbRating) : 0;
            const rB = b.imdbRating !== "N/A" ? parseFloat(b.imdbRating) : 0;
            return rB - rA;
        });
    }
    if (finalMovies.length) {
        gridElement.innerHTML = finalMovies.map(m => buildCard(m)).join("");
    } else {
        gridElement.innerHTML = `<div class="loading">Could not load movies.</div>`;
    }
}

async function renderVault() {
    if (favourites.length === 0) {
        vaultGrid.innerHTML = `<p class="empty-state">Your vault is currently empty. Start adding movies!</p>`;
        return;
    }
    const detailedFavs = await Promise.all(
        favourites.map(async (f) => {
            if (f.imdbRating) return f;
            const details = await fetchMovieDetails(f.imdbID);
            return details || f;
        })
    );
    vaultGrid.innerHTML = detailedFavs.map(m => buildCard(m)).join("");
}

function toggleFav(imdbID, title, poster, year, rating) {
    const exists = favourites.find(f => f.imdbID === imdbID);
    if (exists) {
        favourites = favourites.filter(f => f.imdbID !== imdbID);
    } else {
        favourites.push({ imdbID, Title: title, Poster: poster, Year: year, imdbRating: rating });
    }
    localStorage.setItem("movieFavs", JSON.stringify(favourites));
    renderVault();
    document.querySelectorAll(`.card[data-id="${imdbID}"] .fav-toggle-btn`).forEach(btn => {
        const isNowFav = favourites.some(f => f.imdbID === imdbID);
        btn.textContent = isNowFav ? "REMOVE FROM VAULT" : "ADD TO VAULT";
        btn.classList.toggle('remove', isNowFav);
    });
}

function buildCard(movie) {
    const isFav = favourites.some(f => f.imdbID === movie.imdbID);
    const poster = movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : "https://images.unsplash.com/photo-1485011749176-7919864e43e7?auto=format&fit=crop&q=80&w=200&h=300";
    const safeTitle = (movie.Title || "").replace(/'/g, "\\'");
    const rating = movie.imdbRating && movie.imdbRating !== "N/A" ? movie.imdbRating : "—";
    return `
        <div class="card" data-id="${movie.imdbID}">
            <div class="card-rating">⭐ ${rating}</div>
            <img src="${poster}" alt="${movie.Title}" loading="lazy">
            <div class="card-info">
                <h3 title="${movie.Title}">${movie.Title}</h3>
                <p>${movie.Year} · Movie</p>
                <button 
                    class="fav-toggle-btn ${isFav ? 'remove' : ''}" 
                    onclick="toggleFav('${movie.imdbID}', '${safeTitle}', '${poster}', '${movie.Year}', '${rating}')">
                    ${isFav ? 'REMOVE FROM VAULT' : 'ADD TO VAULT'}
                </button>
            </div>
        </div>`;
}
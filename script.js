// =============================
// GLOBAL CONSTANTS
// =============================
const userUrl = "http://localhost:3000/users";
const API_KEY = "2aec716c";

// Buttons (may not exist on every page, so use optional chaining later)
const signbtn = document.getElementById("signbtn");
const loginbtn = document.getElementById("loginbtn");
const forgotpwdbtn = document.getElementById("forgotpwdbtn");

const loader = document.querySelector(".loader");

// Common URL params (used in loginSuccess.html)
const params = new URLSearchParams(location.search);
const userId = params.get("id");

// =============================
// ON LOAD
// =============================
window.addEventListener("load", () => {
  // Loader fade out (if present)
  if (loader) {
    loader.classList.add("loader-hidden");
    loader.addEventListener("transitionend", () => loader.remove());
  }

  // Only fetch username on success page (where #userName exists)
  const userNameEl = document.getElementById("userName");
  if (userNameEl && userId) {
    fetch(userUrl)
      .then(res => res.json())
      .then(users => {
        const user = users.find(u => u.id == userId);
        if (user) {
          userNameEl.innerText = "Welcome: " + user.user.toUpperCase();
        }
      })
      .catch(() => {
        showToast("Failed to load user info", "danger");
      });
  }

  // Init scroll-triggered title (if present)
  initScrollTitle();
});

// =============================
// FETCH ALL USERS
// =============================
async function getUsers() {
  const res = await fetch(userUrl);
  return res.json();
}

// =============================
// SIGN UP
// =============================
signbtn?.addEventListener("click", async () => {
  const signuserEl = document.getElementById("signuser");
  const signpwdEl = document.getElementById("signpwd");
  const signuser = signuserEl.value.trim().toLowerCase();
  const signpwd = signpwdEl.value.trim().toLowerCase();

  if (!signuser || !signpwd) {
    showToast("Enter valid data", "warning");
    return;
  }

  const users = await getUsers();
  const exists = users.find(u => u.user === signuser);

  if (exists) {
    showToast("User already exists", "danger");
    return;
  }

  await fetch(userUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: signuser, pwd: signpwd })
  });

  signuserEl.value = "";
  signpwdEl.value = "";

  showToast("Account created successfully", "success");
});

// =============================
// LOGIN
// =============================
loginbtn?.addEventListener("click", async () => {
  const loguserEl = document.getElementById("loguser");
  const logpwdEl = document.getElementById("logpwd");
  const loguser = loguserEl.value.trim().toLowerCase();
  const logpwd = logpwdEl.value.trim().toLowerCase();

  if (!loguser || !logpwd) {
    showToast("Enter valid username or password", "danger");
    return;
  }

  const users = await getUsers();
  const match = users.find(u => u.user === loguser && u.pwd === logpwd);

  if (!match) {
    showToast("Invalid credentials", "danger");
    return;
  }

  showToast("Login Successful", "success");

  setTimeout(() => {
    location.href = `loginSuccess.html?id=${match.id}`;
  }, 500);
});

// =============================
// FORGOT PASSWORD
// =============================
forgotpwdbtn?.addEventListener("click", async () => {
  const forgotuserEl = document.getElementById("forgotuser");
  const forgotpwdEl = document.getElementById("forgotpwd");
  const forgotuser = forgotuserEl.value.trim().toLowerCase();
  const forgotpwd = forgotpwdEl.value.trim().toLowerCase();

  if (!forgotuser || !forgotpwd) {
    showToast("Enter valid data", "warning");
    return;
  }

  const users = await getUsers();
  const userObj = users.find(u => u.user === forgotuser);

  if (!userObj) {
    showToast("User does not exist", "danger");
    return;
  }

  await fetch(`${userUrl}/${userObj.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pwd: forgotpwd })
  });

  showToast("Password updated", "success");

  forgotuserEl.value = "";
  forgotpwdEl.value = "";
});

// =============================
// SEARCH MOVIES (OMDb)
// =============================
async function searchMovies() {
  const input = document.getElementById("searchInput");
  const movieResults = document.getElementById("movieResults");
  if (!input || !movieResults) return;

  const query = input.value.trim();
  movieResults.innerHTML = "";

  if (!query) {
    showToast("Please enter a movie name", "warning");
    return;
  }

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (data.Response === "False") {
      movieResults.innerHTML =
        `<p class="text-danger fw-bold">No movies found for "${query}"</p>`;
      return;
    }

    data.Search.forEach(movie => {
      const poster =
        movie.Poster && movie.Poster !== "N/A"
          ? movie.Poster
          : "https://via.placeholder.com/200x300?text=No+Image";

      const card = document.createElement("div");
      card.className = "card shadow-sm";
      card.style.width = "14rem";
      card.innerHTML = `
        <img src="${poster}" class="card-img-top" alt="${movie.Title}">
        <div class="card-body">
          <h5 class="card-title">${movie.Title}</h5>
          <p class="card-text mb-1">Year: ${movie.Year}</p>
          <button class="btn btn-sm btn-outline-primary" onclick="addToFav('${movie.imdbID}')">
            <i class="bi bi-heart"></i> Add to Favorites
          </button>
        </div>
      `;
      movieResults.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    showToast("Error fetching movies", "danger");
  }
}

// =============================
// ADD TO FAVORITES
// =============================
function addToFav(imdbID) {
  const allFavs = JSON.parse(localStorage.getItem("favorites")) || {};
  if (!userId) {
    showToast("Please login again", "warning");
    return;
  }

  if (!allFavs[userId]) allFavs[userId] = [];

  if (!allFavs[userId].includes(imdbID)) {
    allFavs[userId].push(imdbID);
    showToast("Added to Favorites!", "success");
  } else {
    showToast("Already in Favorites!", "warning");
  }

  localStorage.setItem("favorites", JSON.stringify(allFavs));
}

// =============================
// REMOVE FAVORITE
// =============================
function removeFavorite(imdbID) {
  const allFavs = JSON.parse(localStorage.getItem("favorites")) || {};
  const userFavs = allFavs[userId] || [];

  allFavs[userId] = userFavs.filter(id => id !== imdbID);

  localStorage.setItem("favorites", JSON.stringify(allFavs));

  showToast("Removed from favorites", "danger");

  displayFavorites();
}

// =============================
// DISPLAY FAVORITES
// =============================
async function displayFavorites() {
  const favList = document.getElementById("favList");
  if (!favList) return;

  const allFavs = JSON.parse(localStorage.getItem("favorites")) || {};
  const ids = allFavs[userId] || [];

  favList.innerHTML = "";

  if (ids.length === 0) {
    favList.innerHTML =
      `<p class="text-danger fw-bold">No favorites added yet!</p>`;
    return;
  }

  for (const imdbID of ids) {
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`
      );
      const data = await res.json();

      favList.innerHTML += `
        <div class="card p-2 mb-2">
          <div class="d-flex justify-content-between align-items-center">

            <div class="d-flex">
              <img src="${data.Poster}" height="80" class="rounded shadow-sm me-2">
              <div class="ms-2">
                <h5 class="m-0">${data.Title}</h5>
                <p class="text-muted m-0">Year: ${data.Year}</p>
              </div>
            </div>

            <button class="btn btn-danger btn-sm" onclick="removeFavorite('${imdbID}')">
              <i class="bi bi-trash"></i>
            </button>

          </div>
        </div>
      `;
    } catch {
      showToast("Error loading favorite movie", "danger");
    }
  }
}

// =============================
// TOAST FUNCTION
// =============================
function showToast(message, type = "success") {
  const container = document.querySelector(".toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast show text-white bg-${type} mb-2`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// =============================
// CLEAR INPUT HELPERS
// =============================
function clearLogData() {
  const loguser = document.getElementById("loguser");
  const logpwd = document.getElementById("logpwd");
  if (loguser) loguser.value = "";
  if (logpwd) logpwd.value = "";
}

function clearSignData() {
  const signuser = document.getElementById("signuser");
  const signpwd = document.getElementById("signpwd");
  if (signuser) signuser.value = "";
  if (signpwd) signpwd.value = "";
}

function clearForgotData() {
  const forgotuser = document.getElementById("forgotuser");
  const forgotpwd = document.getElementById("forgotpwd");
  if (forgotuser) forgotuser.value = "";
  if (forgotpwd) forgotpwd.value = "";
}

// =============================
// LOGOUT
// =============================
function logout() {
  location.href = "index.html";
}

// =============================
// SCROLL-TRIGGERED TITLE
// =============================
function initScrollTitle() {
  const title = document.querySelector(".scroll-title");
  if (!title) return;

  // If IntersectionObserver is available, use it
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            title.classList.add("show");
            observer.unobserve(title);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(title);
  } else {
    // Fallback: show on first scroll
    function onScroll() {
      const rect = title.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        title.classList.add("show");
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
  }
}



fetch("users.json")
  .then(res => res.json())
  .then(data => {
    console.log(data);
  })
  .catch(err => console.log("Error loading JSON:", err));
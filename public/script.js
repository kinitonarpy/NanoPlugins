// ===== STATE =====
let timeout = null;
let currentQuery = "";
let currentPage = 1;
let selectedVersions = [];

// ===== SEARCH =====
function searchPlugins() {
  const query = document.getElementById("search").value;

  clearTimeout(timeout);

  timeout = setTimeout(() => {
    if (query.trim() === "") {
      document.getElementById("plugins").innerHTML = "";
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    loadPlugins(query, 1);
  }, 300);
}

// ===== LOAD PLUGINS =====
async function loadPlugins(query = "", page = 1) {
  currentQuery = query;
  currentPage = page;

  const versionEl = document.getElementById("version");
  const version = versionEl ? versionEl.value : "";

  try {
    const res = await fetch(
      `/api/plugins?q=${encodeURIComponent(query)}&version=${version}&page=${page}`
    );

    const data = await res.json();

    const container = document.getElementById("plugins");
    container.innerHTML = "";

    if (!data.hits || data.hits.length === 0) {
      container.innerHTML = "<p>No plugins found.</p>";
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    data.hits.forEach(plugin => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${plugin.icon_url}" />
        <h3>${plugin.title}</h3>
        <p>${plugin.description}</p>
        <button onclick="openDownloadModal('${plugin.project_id}')">
          Download
        </button>
      `;

      container.appendChild(card);
    });

    renderPagination(data.total);

  } catch (err) {
    console.error("Error loading plugins:", err);
  }
}

// ===== PAGINATION =====
function renderPagination(total) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return;

  const maxPagesToShow = 5;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxPagesToShow - 1);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn";

    if (i === currentPage) {
      btn.classList.add("active");
    }

    btn.innerText = i;
    btn.onclick = () => loadPlugins(currentQuery, i);

    container.appendChild(btn);
  }
}

// ===== OPEN MODAL =====
async function openDownloadModal(id) {
  try {
    const res = await fetch(`/api/plugin/${id}`);
    const versions = await res.json();

    selectedVersions = versions;

    const versionSelect = document.getElementById("version-select");
    const platformSelect = document.getElementById("platform-select");

    versionSelect.innerHTML = "";
    platformSelect.innerHTML = "";

    const seenVersions = new Set();
    const seenPlatforms = new Set();

    versions.forEach(v => {
      v.game_versions.forEach(ver => seenVersions.add(ver));
      v.loaders.forEach(loader => seenPlatforms.add(loader));
    });

    // populate versions
    seenVersions.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      versionSelect.appendChild(opt);
    });

    // populate platforms
    seenPlatforms.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      platformSelect.appendChild(opt);
    });

    document.getElementById("download-modal").style.display = "flex";

  } catch (err) {
    console.error("Error loading versions:", err);
  }
}

// ===== DOWNLOAD SELECTED =====
function confirmDownload() {
  const version = document.getElementById("version-select").value;
  const platform = document.getElementById("platform-select").value;

  const match = selectedVersions.find(v =>
    v.game_versions.includes(version) &&
    v.loaders.includes(platform)
  );

  if (!match) {
    alert("No matching version found");
    return;
  }

  const file = match.files[0];
  window.open(file.url, "_blank");

  closeModal();
}

// ===== CLOSE MODAL =====
function closeModal() {
  document.getElementById("download-modal").style.display = "none";
}
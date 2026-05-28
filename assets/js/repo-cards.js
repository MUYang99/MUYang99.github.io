(function () {
  const langColors = {
    Python: "#3572A5",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Jupyter: "#DA5B0B",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    C: "#555555",
    "C++": "#f34b7d",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
  };

  function formatCount(value) {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    return String(value);
  }

  function setLanguage(el, language) {
    if (!language) {
      return;
    }
    const color = langColors[language] || "#858585";
    el.innerHTML = `<span class="repo-card-lang-dot" style="background:${color}"></span>${language}`;
  }

  async function loadRepoCard(card) {
    const fullName = card.dataset.repo;
    const descriptionEl = card.querySelector(".repo-card-description");
    const languageEl = card.querySelector(".repo-card-language");
    const starsEl = card.querySelector(".repo-card-stars");
    const forksEl = card.querySelector(".repo-card-forks");

    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}`);
      if (!response.ok) {
        throw new Error("Failed to fetch repository");
      }
      const data = await response.json();
      descriptionEl.textContent = data.description || "No description provided.";
      starsEl.innerHTML = `<i class="fa-regular fa-star"></i> ${formatCount(data.stargazers_count)}`;
      forksEl.innerHTML = `<i class="fa-solid fa-code-branch"></i> ${formatCount(data.forks_count)}`;
      setLanguage(languageEl, data.language);
    } catch (error) {
      descriptionEl.textContent = "Repository details are temporarily unavailable.";
      starsEl.innerHTML = '<i class="fa-regular fa-star"></i> —';
      forksEl.innerHTML = '<i class="fa-solid fa-code-branch"></i> —';
    }
  }

  async function loadUserCard(card) {
    const username = card.dataset.githubUser;
    const descriptionEl = card.querySelector(".repo-card-description");
    const reposEl = card.querySelector(".repo-card-repos");
    const followersEl = card.querySelector(".repo-card-followers");

    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      descriptionEl.textContent = data.bio || `@${username} on GitHub`;
      reposEl.innerHTML = `<i class="fa-solid fa-book"></i> ${formatCount(data.public_repos)} repos`;
      followersEl.innerHTML = `<i class="fa-solid fa-users"></i> ${formatCount(data.followers)} followers`;
    } catch (error) {
      descriptionEl.textContent = `@${username} on GitHub`;
      reposEl.innerHTML = '<i class="fa-solid fa-book"></i> — repos';
      followersEl.innerHTML = '<i class="fa-solid fa-users"></i> — followers';
    }
  }

  document.querySelectorAll("[data-repo]").forEach((card) => {
    loadRepoCard(card);
  });

  document.querySelectorAll("[data-github-user]").forEach((card) => {
    loadUserCard(card);
  });
})();

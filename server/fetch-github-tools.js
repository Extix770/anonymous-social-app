require('dotenv').config();
const fs = require("fs");

async function fetchCyberSecurityTools() {
  try {
    const { Octokit } = await import("octokit");
    const octokit = new Octokit({
      auth: process.env.GITHUB_API_KEY,
    });

    const q = "topic:cybersecurity tool in:name";
    const { data: { items: repos } } = await octokit.request("GET /search/repositories", {
      q,
      sort: "stars",
      order: "desc",
      per_page: 10,
    });

    const tools = repos.map((repo) => ({
      name: repo.name,
      owner: repo.owner.login,
      url: repo.html_url,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
    }));

    fs.writeFileSync("github-tools.json", JSON.stringify(tools, null, 2));
    console.log("Successfully fetched and saved cybersecurity tools.");
  } catch (error) {
    console.error("Error fetching cybersecurity tools:", error);
  }
}

fetchCyberSecurityTools();

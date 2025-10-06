const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

const FEEDS = [
  'https://feeds.feedburner.com/TheHackersNews',
  'https://krebsonsecurity.com/feed/',
  'https://www.wired.com/feed/category/security/latest/rss',
  'https://www.schneier.com/feed/',
];

const NEWS_FILE_PATH = path.join(__dirname, 'cybersecurity-news.json');

async function fetchNews() {
  try {
    let allNews = [];
    for (const feedUrl of FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        allNews = [...allNews, ...feed.items];
      } catch (error) {
        console.error(`Error fetching feed: ${feedUrl}`, error);
      }
    }

    // Sort by date and take the latest 20
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const latestNews = allNews.slice(0, 20);

    // Save to a JSON file
    fs.writeFileSync(NEWS_FILE_PATH, JSON.stringify(latestNews, null, 2));
    console.log('Successfully fetched and saved cybersecurity news.');
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}

fetchNews();

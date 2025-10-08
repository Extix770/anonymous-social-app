import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

const CyberSecurityNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`${apiUrl}/cybersecurity-news`);
        setNews(response.data);
      } catch (error) {
        console.error('Error fetching cybersecurity news:', error);
      }
    };

    const initialFetch = async () => {
      setLoading(true);
      await fetchNews();
      setLoading(false);
    };

    initialFetch();

    const intervalId = setInterval(fetchNews, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  return (
    <div>
      <h2 className="text-center mb-4">Cybersecurity News</h2>
      {loading ? (
        <p className="text-center">Loading news...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {news.map((item, index) => (
            <div key={index} className="card h-100">
              <div className="card-body d-flex flex-column">
                <h6 className="card-title"><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h6>
                <p><small className="text-muted">{new Date(item.pubDate).toLocaleString()}</small></p>
                <p className="card-text flex-grow-1">{item.contentSnippet}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CyberSecurityNews;

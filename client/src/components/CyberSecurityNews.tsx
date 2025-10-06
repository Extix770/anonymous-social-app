import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/cybersecurity-news`);
        setNews(response.data);
      } catch (error) {
        console.error('Error fetching cybersecurity news:', error);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title text-center">Cybersecurity News</h5>
        {loading ? (
          <p className="text-center">Loading news...</p>
        ) : (
          <ul className="list-group list-group-flush">
            {news.map((item, index) => (
              <li key={index} className="list-group-item">
                <h6><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h6>
                <p><small className="text-muted">{new Date(item.pubDate).toLocaleString()}</small></p>
                <p>{item.contentSnippet}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CyberSecurityNews;

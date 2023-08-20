import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WikipediaPage() {
  const [pageContent, setPageContent] = useState('');
  const [query, setQuery] = useState('React'); // Default query
  const [loading, setLoading] = useState(false);

  const fetchWikipediaPage = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=links&format=json&titles=${query}`
      );

      console.log('Wikipedia API response:', response);

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const content = pages[pageId].links;;
      
      setPageContent(content);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Wikipedia page:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWikipediaPage();
  }, [query]);

  return (
    <div>
      <h1>Wikipedia Page Viewer</h1>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a Wikipedia query"
        />
        <button onClick={fetchWikipediaPage} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: pageContent }} />
    </div>
  );
}

export default WikipediaPage;

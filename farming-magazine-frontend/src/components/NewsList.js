import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const NewsList = () => {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = async (page) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.GET_NEWS}?page=${page}&limit=5`, {
        headers: { ...getAuthHeader() },
      });
      const { news, total } = response.data.data;
      setNews(news);
      setTotalPages(Math.ceil(total / 5));
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const deleteNews = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await axios.delete(API_ENDPOINTS.DELETE_NEWS(id), {
          headers: { ...getAuthHeader() },
        });
        fetchNews(page);
        alert('News deleted successfully.');
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  useEffect(() => {
    fetchNews(page);
  }, [page]);

  return (
    <div>
      <h3>News List</h3>
      {news.map((item) => (
        <div key={item._id}>
          <h4>{item.title}</h4>
          <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
          <button onClick={() => deleteNews(item._id)}>Delete</button>
        </div>
      ))}
      <div>
        <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Previous</button>
        <span> Page {page} of {totalPages} </span>
        <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
      </div>
    </div>
  );
};

export default NewsList;

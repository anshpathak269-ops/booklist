import React from 'react';
import BookList from './components/BookList';

function App() {
  return (
    <div style={{ padding: 20, frontFamily: "Arial, sans-serif" }}>
      <h1>Book Manager</h1>
      <BookList />
    </div>
  );
}

export default App;
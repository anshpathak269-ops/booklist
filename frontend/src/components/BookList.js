import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api";

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", published_date: "" });
  const [editingID, setEditingID] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load books from API
  // eslint-disable-next-line react-hooks/exhaustive-deps, no-undef
  const loadBooks = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const qp = new URLSearchParams();
      const query = opts.q !== undefined ? opts.q : q;
      const pg = opts.page !== undefined ? opts.page : page;
      
      if (query) qp.set("q", query);
      if (pg) qp.set("page", pg);

      const response = await fetch(`${API_URL}/books/?${qp.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // If no pagination
        setBooks(data);
        setCount(data.length);
        setNext(null);
        setPrevious(null);
      } else {
        setBooks(data.results || []);
        setCount(data.count || 0);
        setNext(data.next || null);
        setPrevious(data.previous || null);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setError("Failed to load books. Please try again.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    loadBooks({ page: 1 });
  }, [loadBooks]);

  // Create new book
  const handleCreate = async () => {
    if (!form.title || !form.author || !form.published_date) {
      setError("All fields are required.");
      return;
    }
    
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/books/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setForm({ title: "", author: "", published_date: "" });
      await loadBooks({ page: 1 }); // reload from first page
      setPage(1); // Reset to first page after creating
    } catch (err) {
      console.error("Error creating book:", err);
      setError("Failed to create book. Please check your input and try again.");
    }
  };

  // Delete book
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }
    
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/books/${id}/`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await loadBooks({ page });
    } catch (err) {
      console.error("Error deleting book:", err);
      setError("Failed to delete book. Please try again.");
    }
  };

  // Update book
  const handleUpdate = async () => {
    if (!form.title || !form.author || !form.published_date) {
      setError("All fields are required.");
      return;
    }
    
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/books/${editingID}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setEditingID(null);
      setForm({ title: "", author: "", published_date: "" });
      await loadBooks({ page });
    } catch (err) {
      console.error("Error updating book:", err);
      setError("Failed to update book. Please check your input and try again.");
    }
  };

  const startEdit = (b) => {
    setEditingID(b.id);
    setForm({ 
      title: b.title || "", 
      author: b.author || "", 
      published_date: b.published_date || "" 
    });
  };

  const cancelEdit = () => {
    setEditingID(null);
    setForm({ title: "", author: "", published_date: "" });
    setError(null);
  };

  // Pagination
  const goPrev = () => {
    if (!previous || loading) return;
    
    try {
      const params = new URL(previous).searchParams;
      const pg = parseInt(params.get("page") || "1", 10);
      setPage(pg);
      loadBooks({ page: pg });
    } catch (err) {
      console.error("Error parsing previous URL:", err);
    }
  };

  const goNext = () => {
    if (!next || loading) return;
    
    try {
      const params = new URL(next).searchParams;
      const pg = parseInt(params.get("page") || "1", 10);
      setPage(pg);
      loadBooks({ page: pg });
    } catch (err) {
      console.error("Error parsing next URL:", err);
    }
  };

  // Search
  const doSearch = () => {
    setPage(1);
    loadBooks({ page: 1, q });
  };

  const clearSearch = () => {
    setQ("");
    setPage(1);
    loadBooks({ page: 1, q: "" });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      doSearch();
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, fontFamily: 'Arial, sans-serif' }}>
      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          padding: "12px", 
          borderRadius: "4px", 
          marginBottom: "16px",
          border: "1px solid #ffcdd2",
          position: "relative"
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              position: "absolute",
              right: "12px",
              top: "12px",
              background: "none", 
              border: "none", 
              color: "#c62828",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px"
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          placeholder="Search title or author..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ 
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px"
          }}
        />
        <button 
          onClick={doSearch}
          disabled={loading}
          style={{ 
            padding: "8px 12px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {q && (
          <button 
            onClick={clearSearch}
            disabled={loading}
            style={{ 
              padding: "8px 12px",
              backgroundColor: "#757575",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            Clear
          </button>
        )}
      </div>

      <h2 style={{ color: "#333", marginBottom: 16 }}>
        Book List {loading && <span style={{ fontSize: "14px", color: "#666" }}>(Loading...)</span>}
      </h2>
      
      {books.length === 0 && !loading ? (
        <div style={{ 
          textAlign: "center", 
          color: "#666", 
          fontStyle: "italic",
          padding: "40px 20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <p>No books found. {q ? "Try a different search term or" : ""} Add your first book below!</p>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {books.map((b) => (
            <div key={b.id} style={{ 
              marginBottom: 12, 
              padding: "16px",
              border: "1px solid #eee",
              borderRadius: "8px",
              backgroundColor: editingID === b.id ? "#e3f2fd" : "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#333" }}>{b.title}</h4>
                <p style={{ margin: "0 0 4px 0", color: "#666" }}>by {b.author}</p>
                <small style={{ color: "#999" }}>Published: {b.published_date}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => startEdit(b)}
                  disabled={loading || (editingID !== null && editingID !== b.id)}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: editingID === b.id ? "#FFC107" : "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}
                >
                  {editingID === b.id ? "Editing..." : "Edit"}
                </button>
                <button 
                  onClick={() => handleDelete(b.id)}
                  disabled={loading}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(next || previous) && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: 8, 
          margin: "20px 0",
          padding: "12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          border: "1px solid #e0e0e0"
        }}>
          <button 
            onClick={goPrev} 
            disabled={!previous || loading}
            style={{ 
              padding: "8px 16px",
              backgroundColor: previous && !loading ? "#2196F3" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: previous && !loading ? "pointer" : "not-allowed"
            }}
          >
            ← Previous
          </button>
          <span style={{ fontWeight: "500", color: "#333" }}>
            Page {page} • Total: {count} books
          </span>
          <button 
            onClick={goNext} 
            disabled={!next || loading}
            style={{ 
              padding: "8px 16px",
              backgroundColor: next && !loading ? "#2196F3" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: next && !loading ? "pointer" : "not-allowed"
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Add / Update Form */}
      <div style={{ 
        marginTop: "24px", 
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa"
      }}>
        <h3 style={{ marginTop: 0, color: "#333" }}>
          {editingID ? "Update Book" : "Add New Book"}
        </h3>
        
        <div style={{ display: "grid", gap: 12, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ 
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
          <input
            type="text"
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            style={{ 
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
          <input
            type="date"
            value={form.published_date}
            onChange={(e) => setForm({ ...form, published_date: e.target.value })}
            style={{ 
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
          
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={editingID ? handleUpdate : handleCreate}
              disabled={loading}
              style={{ 
                flex: 1,
                padding: "12px",
                backgroundColor: editingID ? "#2196F3" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Saving..." : (editingID ? "Save Changes" : "Add Book")}
            </button>
            {editingID && (
              <button
                onClick={cancelEdit}
                disabled={loading}
                style={{ 
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.7 : 1
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
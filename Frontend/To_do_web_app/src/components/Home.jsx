import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');
  const navigate = useNavigate();

  // Function to fetch todos from the backend
  const fetchTodos = async () => {
    // Only fetch if an access token exists. The api.js file will handle adding it.
    if (!localStorage.getItem('access_token')) {
      console.log('No access token found. Not fetching todos.');
      setLoading(false);
      return;
    }

    try {
      // The `api` instance in api.js will automatically add the authorization header
      const response = await api.get('/todos');
      setTodos(response.data.todos || []);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired, clear it and redirect to login
        localStorage.removeItem('access_token');
        navigate('/login');
      }
      console.error("Failed to fetch todos:", error.response || error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This effect runs on component mount.
    // It checks for a new token in the URL or an existing one in local storage.
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('access_token');

    if (tokenFromUrl) {
      // If a new token is found in the URL, save it and remove it from the URL
      localStorage.setItem('access_token', tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch todos with the new token
      fetchTodos();
    } else if (localStorage.getItem('access_token')) {
      // If no token in URL, try to use the one from local storage
      fetchTodos();
    } else {
      // No token at all, redirect to login
      navigate('/');
    }
  }, [navigate]);

  // Function to add a new to-do item
  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    try {
      const response = await api.post('/todos', { title: newTodoTitle });
      setTodos([...todos, response.data]);
      setNewTodoTitle('');
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  // Function to delete a to-do item
  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // Function to toggle the completion status of a to-do item
  const toggleComplete = async (todo) => {
    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      await api.put(`/todos/${todo.id}`, updatedTodo);
      setTodos(todos.map(t => (t.id === todo.id ? updatedTodo : t)));
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  // Function to handle the start of editing
  const startEditing = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  };

  // Function to save the edited to-do item
  const saveEditedTodo = async (e) => {
    e.preventDefault();
    if (!editingTodoTitle.trim()) return;
    try {
      const updatedTodo = {
        title: editingTodoTitle,
        completed: todos.find(t => t.id === editingTodoId).completed
      };
      await api.put(`/todos/${editingTodoId}`, updatedTodo);
      setTodos(todos.map(t => (t.id === editingTodoId ? { ...t, title: editingTodoTitle } : t)));
      setEditingTodoId(null);
      setEditingTodoTitle('');
    } catch (error) {
      console.error("Failed to edit todo:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-xl font-medium text-gray-700">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen w-full p-8 flex items-start justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-200 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-extrabold text-gray-800">Your To-Do List</h2>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl transition duration-300 transform hover:scale-105 shadow-md"
          >
            Logout
          </button>
        </div>

        {/* Form to add a new todo */}
        <form onSubmit={addTodo} className="mb-8 flex space-x-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new to-do..."
            className="flex-grow p-3 rounded-lg border-2 border-white-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white-700 transition duration-300"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
          >
            Add
          </button>
        </form>

        {/* Display the list of todos */}
        {todos.length === 0 ? (
          <p className="text-center text-white-500 text-lg">You have no to-do items.</p>
        ) : (
          <ul className="space-y-4">
            {todos.map((todo) => (
              <li key={todo.id} className="bg-gray-50 p-5 rounded-xl  shadow-sm flex items-center justify-between hover:bg-gray-100 transition duration-300  text-white-800">
                {editingTodoId === todo.id ? (
                  // Form for editing the todo title
                  <form onSubmit={saveEditedTodo} className="flex-grow flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingTodoTitle}
                      onChange={(e) => setEditingTodoTitle(e.target.value)}
                      className="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white-700"
                      required
                    />
                    <button type="submit" className="text-green-500 hover:text-green-600 font-medium">Save</button>
                    <button type="button" onClick={() => setEditingTodoId(null)} className="text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                  </form>
                ) : (
                  // Displaying the todo title and buttons
                  <>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleComplete(todo)}
                        className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full cursor-pointer"
                      />
                      <span className={`text-lg transition duration-300 ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                        {todo.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => startEditing(todo)} className="text-blue-500 hover:text-blue-600 font-medium transition duration-300">
                        Edit
                      </button>
                      <button onClick={() => deleteTodo(todo.id)} className="text-red-500 hover:text-red-600 font-medium transition duration-300">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;

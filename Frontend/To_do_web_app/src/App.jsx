import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from "./components/register";
import Login from "./components/login";
import Home from "./components/Home";
// ... (imports)

function App() {
  return (
     <div className="min-h-screen w-full  bg-gray-100 p-8">
      <Router>
        <nav className="mb-8">
          <Link to="/Home" className="mx-2 text-blue-500 hover:text-blue-700">Home</Link> | 
          <Link to="/login" className="mx-2 text-blue-500 hover:text-blue-700">Login</Link> | 
          <Link to="/" className="mx-2 text-blue-500 hover:text-blue-700">Register</Link>
        </nav>

        <Routes>
          <Route path="/Home" element={<Home/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Register />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
import axios from "axios";
import { useState } from "react"
import { useNavigate } from "react-router-dom";

const Register = ()=>{

    const [formData,setFormData] = useState({
        userName:"",
        email:"",
        password:""

    });

    const navigate = useNavigate();

    const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const API_CALL = `https://to-do-app-managemnt-1.onrender.com/register`;

    console.log('Registration Form Data:', formData);
    if (!formData.userName || !formData.email || !formData.password) {
      alert('Please fill in all fields.');
      return;
    }

    try{

        const response = await axios.post(API_CALL,formData);
        console.log(response.data);
        
        alert('Registration successful!');
        navigate('/login');
        return response.data
        

    }
    catch(error){
        console.log(error);

    }
    
  };
    // This function now correctly redirects to the Google login route on the backend
    const google_login = async ()=>{
      window.location.href = 'https://to-do-app-managemnt-1.onrender.com/login/google';
    }
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100"> 
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userName">
            Username:
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Register
          </button>
        </div>
      </form>
      {/* Separator and Google Sign-in Button */}
      <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
      </div>
      <div className="flex items-center justify-center">
        <button 
          onClick={google_login} 
          className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow flex items-center space-x-2"
        >
          <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12.062 1.25c-4.469 0-8.1 3.197-8.1 7.217 0 2.222 1.155 4.382 3.864 5.928-.275.467-.714 1.254-.805 1.701-.13.627-.14 1.144-.14 1.217l-.001.002h1.666l.001-.002.001-.002c.039-.142.155-.544.332-1.22.18-.68.647-1.745 1.34-2.871a8.889 8.889 0 0 1 3.9-1.272c4.47 0 8.1-3.198 8.1-7.217 0-4.02-3.63-7.217-8.1-7.217Zm0 12c-2.484 0-4.5-2.023-4.5-4.5S9.578 4.25 12.062 4.25c2.484 0 4.5 2.023 4.5 4.5s-2.016 4.5-4.5 4.5Z" clipRule="evenodd"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default Register;

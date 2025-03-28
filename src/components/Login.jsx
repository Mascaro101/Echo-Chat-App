import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

import { Buffer } from 'buffer';

import init, { generate_private_key, generate_public_key} from '/dh-wasm/pkg';


const Login = () => {
  console.log('Login component rendered');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Username and password cannot be empty');
      console.error('Username and password cannot be empty');
      return;
    }

    await init();

    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const privatePreKey = generate_private_key(randomBytes);
    const publicPreKey = generate_public_key(privatePreKey);

    console.log("Private Pre Key:", new Uint8Array(privatePreKey));
    console.log("Public Pre Key:", new Uint8Array(publicPreKey));

    const publicPreKeyString = Buffer.from(publicPreKey).toString('base64');
    const arrayBufferToBase64 = (buffer) => {
      return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    };

    const privateKeyBase64 = arrayBufferToBase64(privatePreKey);
    localStorage.setItem("privatePreKey", privateKeyBase64);

    
    // Connect to the server temporarily to handle login
    const tempSocket = io(import.meta.env.VITE_SOCKET_URL);

    tempSocket.on('connect', () => {
      console.log('TempSocket connected');
    });

    tempSocket.on('connect_error', (err) => {
      console.error('TempSocket connection error:', err);
    });

    // Handle login response
    tempSocket.emit('login', { username, password }, (response) => {
      if (response.success) {
        // Save token to local storage
        localStorage.setItem('token', response.token);
        console.log('Login successful:', response.token);
        navigate('/dashboard'); // Navigate to the dashboard after successful login
      } else {
        setError(response.error || 'Login failed');
        console.error('Login failed:', response.error);
      }
      tempSocket.disconnect(); // Disconnect the temporary socket after handling login
    });
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
// Component gốc của ứng dụng: bọc Router, Google OAuth Provider, Auth Context và các tuyến đường
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';
import { GOOGLE_CLIENT_ID } from './config/authConfig';
import './styles/auth.css';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;

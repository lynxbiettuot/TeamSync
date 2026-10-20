import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import './styles/auth.css';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

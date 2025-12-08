import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Tracker from './components/Tracker';

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Tracker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './ExcelUploader';
import Login from './component/Login';
import PrivateRoute from './component/PrivateRoute';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

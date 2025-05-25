// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './ExcelUploader';
import Login from './component/Login';
import PrivateRoute from './component/PrivateRoute';
import CollectionViewer from './CollectionViewer';
import Header from './component/Header';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/collections" element={
          <PrivateRoute>
            <CollectionViewer />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

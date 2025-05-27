// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './ExcelUploader';
import Login from './component/Login';
import PrivateRoute from './component/PrivateRoute';
import CollectionViewer from './CollectionViewer';
import Header from './component/Header';
import Responses from './component/Responses';
import LeaveReports from './component/LeaveReports';

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
        <Route path="/responses" element={
          <PrivateRoute>
            <Responses />
          </PrivateRoute>
        } />
        <Route path="/leave-reports" element={
          <PrivateRoute>
            <LeaveReports />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

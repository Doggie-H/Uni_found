import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import Admin from './pages/Admin';
import AdminItems from './pages/AdminItems';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="create-item" element={<CreateItem />} />
            <Route path="item/:id" element={<ItemDetail />} />
          </Route>
          
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<Admin />} />
             <Route path="items" element={<AdminItems />} />
             <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


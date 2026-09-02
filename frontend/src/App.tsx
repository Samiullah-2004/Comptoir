import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default App
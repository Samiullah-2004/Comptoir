import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  )
}

export default App
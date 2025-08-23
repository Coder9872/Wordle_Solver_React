import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Solver from './pages/solver.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Solver />} />
      <Route path="/wordle" element={<Solver />} />
      {/* Add more routes as needed */}
    </Routes>
  )


}

export default App

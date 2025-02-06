import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import Home from "./paginas/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;


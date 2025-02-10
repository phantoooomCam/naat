import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./paginas/Principal/Home";
import Registro from "./paginas/Registrarse/Registro"
import SignIn from './paginas/SignIn/SignIn';
import PageNotFound from './paginas/Error/PageNotFound';
import Auth from './paginas/Auth/Auth';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<PageNotFound />}/>
    </Routes>
  );
}

export default App;


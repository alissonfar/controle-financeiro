import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Usuarios from './pages/Usuarios';
import Contas from './pages/Contas';
import Participantes from './pages/Participantes';
import Transacoes from './pages/Transacoes';
import Faturas from './pages/Faturas';
import Cartoes from './pages/Cartoes';
import MetodosPagamento from './pages/MetodosPagamento';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />}>
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="contas" element={<Contas />} />
        <Route path="participantes" element={<Participantes />} />
        <Route path="transacoes" element={<Transacoes />} />
        <Route path="faturas" element={<Faturas />} />
        <Route path="cartoes" element={<Cartoes />} />
        <Route path="metodos_pagamento" element={<MetodosPagamento />} />
      </Route>
    </Routes>
  );
};

export default App;
  
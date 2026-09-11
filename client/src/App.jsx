import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RotaProtegida from './components/RotaProtegida';
import Login from './pages/Login';
import Estoque from './pages/Estoque';
import Clientes from './pages/Clientes';
import Orcamentos from './pages/Orcamentos';
import Ordens from './pages/Ordens';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<Navigate to="/estoque" replace />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="orcamentos" element={<Orcamentos />} />
        <Route path="ordens" element={<Ordens />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

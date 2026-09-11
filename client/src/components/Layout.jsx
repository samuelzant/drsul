import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/estoque', label: 'Estoque' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/ordens', label: 'Ordens de Produção' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();

  function sair() {
    logout();
    navegar('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Metalúrgica</h1>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{usuario?.nome}</span>
          <button onClick={sair}>Sair</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import { createContext, useContext, useState } from 'react';
import { api, getToken, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('metalurgica_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  async function login(usuarioLogin, senha) {
    const dados = await api.post('/auth/login', { usuario: usuarioLogin, senha });
    setToken(dados.token);
    localStorage.setItem('metalurgica_usuario', JSON.stringify(dados.usuario));
    setUsuario(dados.usuario);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('metalurgica_usuario');
    setUsuario(null);
  }

  const autenticado = Boolean(usuario && getToken());

  return (
    <AuthContext.Provider value={{ usuario, autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { useEffect, useState } from 'react';
import { api } from '../api';

const vazio = { nome: '', telefone: '', email: '', documento: '', endereco: '', observacoes: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar(termo = '') {
    const query = termo ? `?busca=${encodeURIComponent(termo)}` : '';
    setClientes(await api.get(`/clientes${query}`));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setForm(vazio);
      setEditandoId(null);
      await carregar(busca);
    } catch (err) {
      setErro(err.message);
    }
  }

  function editar(cliente) {
    setEditandoId(cliente.id);
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      documento: cliente.documento || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || '',
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(vazio);
  }

  async function excluir(id) {
    if (!confirm('Excluir este cliente?')) return;
    setErro('');
    try {
      await api.delete(`/clientes/${id}`);
      await carregar(busca);
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <h2>Clientes</h2>
      {erro && <div className="erro">{erro}</div>}

      <form className="form-card" onSubmit={salvar}>
        <div className="form-row">
          <label>
            Nome
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </label>
          <label>
            Telefone
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            CPF/CNPJ
            <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
          </label>
        </div>
        <div className="form-row">
          <label className="full">
            Endereço
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
          {editandoId && <button type="button" onClick={cancelarEdicao}>Cancelar</button>}
        </div>
      </form>

      <div className="busca-row">
        <input
          placeholder="Buscar cliente por nome..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            carregar(e.target.value);
          }}
        />
      </div>

      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>CPF/CNPJ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td>{c.nome}</td>
              <td>{c.telefone}</td>
              <td>{c.email}</td>
              <td>{c.documento}</td>
              <td>
                <button type="button" onClick={() => editar(c)}>Editar</button>
                <button type="button" onClick={() => excluir(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
          {clientes.length === 0 && (
            <tr><td colSpan={5}>Nenhum cliente encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

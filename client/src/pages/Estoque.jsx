import { useEffect, useState } from 'react';
import { api } from '../api';

const vazio = { nome: '', unidade: 'un', quantidade: 0, estoque_minimo: 0, preco_unitario: 0 };

export default function Estoque() {
  const [materiais, setMateriais] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [movimentacao, setMovimentacao] = useState({});
  const [erro, setErro] = useState('');

  async function carregar() {
    setMateriais(await api.get('/materiais'));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/materiais/${editandoId}`, form);
      } else {
        await api.post('/materiais', form);
      }
      setForm(vazio);
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  function editar(material) {
    setEditandoId(material.id);
    setForm({
      nome: material.nome,
      unidade: material.unidade,
      quantidade: material.quantidade,
      estoque_minimo: material.estoque_minimo,
      preco_unitario: material.preco_unitario,
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(vazio);
  }

  async function excluir(id) {
    if (!confirm('Excluir este material?')) return;
    await api.delete(`/materiais/${id}`);
    await carregar();
  }

  async function registrarMovimentacao(id, tipo) {
    const quantidade = Number(movimentacao[id]);
    if (!quantidade || quantidade <= 0) return;
    setErro('');
    try {
      await api.post(`/materiais/${id}/movimentacao`, { tipo, quantidade, motivo: tipo === 'entrada' ? 'Entrada manual' : 'Saída manual' });
      setMovimentacao({ ...movimentacao, [id]: '' });
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <h2>Estoque de Materiais</h2>
      {erro && <div className="erro">{erro}</div>}

      <form className="form-card" onSubmit={salvar}>
        <div className="form-row">
          <label>
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </label>
          <label>
            Unidade
            <input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
          </label>
          {!editandoId && (
            <label>
              Quantidade inicial
              <input
                type="number"
                step="any"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </label>
          )}
          <label>
            Estoque mínimo
            <input
              type="number"
              step="any"
              value={form.estoque_minimo}
              onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
            />
          </label>
          <label>
            Preço unitário (R$)
            <input
              type="number"
              step="any"
              value={form.preco_unitario}
              onChange={(e) => setForm({ ...form, preco_unitario: e.target.value })}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar material'}</button>
          {editandoId && <button type="button" onClick={cancelarEdicao}>Cancelar</button>}
        </div>
      </form>

      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Unidade</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Preço unit.</th>
            <th>Movimentar</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {materiais.map((m) => (
            <tr key={m.id} className={m.quantidade <= m.estoque_minimo ? 'linha-alerta' : ''}>
              <td>{m.nome}</td>
              <td>{m.unidade}</td>
              <td>{m.quantidade}</td>
              <td>{m.estoque_minimo}</td>
              <td>R$ {Number(m.preco_unitario).toFixed(2)}</td>
              <td>
                <div className="mov-row">
                  <input
                    type="number"
                    step="any"
                    placeholder="qtd"
                    value={movimentacao[m.id] || ''}
                    onChange={(e) => setMovimentacao({ ...movimentacao, [m.id]: e.target.value })}
                  />
                  <button type="button" onClick={() => registrarMovimentacao(m.id, 'entrada')}>+ Entrada</button>
                  <button type="button" onClick={() => registrarMovimentacao(m.id, 'saida')}>- Saída</button>
                </div>
              </td>
              <td>
                <button type="button" onClick={() => editar(m)}>Editar</button>
                <button type="button" onClick={() => excluir(m.id)}>Excluir</button>
              </td>
            </tr>
          ))}
          {materiais.length === 0 && (
            <tr><td colSpan={7}>Nenhum material cadastrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

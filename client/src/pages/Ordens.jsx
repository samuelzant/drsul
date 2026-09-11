import { useEffect, useState } from 'react';
import { api } from '../api';

const statusLabel = {
  pendente: 'Pendente',
  em_producao: 'Em produção',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export default function Ordens() {
  const [ordens, setOrdens] = useState([]);
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [materiaisSelecionados, setMateriaisSelecionados] = useState([]);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  async function carregar() {
    setOrdens(await api.get('/ordens'));
  }

  useEffect(() => {
    carregar();
    api.get('/materiais').then(setMateriaisDisponiveis);
  }, []);

  function adicionarMaterial() {
    setMateriaisSelecionados([...materiaisSelecionados, { material_id: '', quantidade_usada: 1 }]);
  }

  function atualizarMaterial(index, campo, valor) {
    const novos = [...materiaisSelecionados];
    novos[index] = { ...novos[index], [campo]: valor };
    setMateriaisSelecionados(novos);
  }

  function removerMaterial(index) {
    setMateriaisSelecionados(materiaisSelecionados.filter((_, i) => i !== index));
  }

  async function criarOrdem(e) {
    e.preventDefault();
    setErro('');
    try {
      const materiais = materiaisSelecionados
        .filter((m) => m.material_id)
        .map((m) => ({ material_id: Number(m.material_id), quantidade_usada: Number(m.quantidade_usada) }));
      await api.post('/ordens', { descricao, observacoes, materiais });
      setDescricao('');
      setObservacoes('');
      setMateriaisSelecionados([]);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function mudarStatus(id, status) {
    if (status === 'concluida' && !confirm('Concluir a ordem vai dar baixa nos materiais vinculados no estoque. Continuar?')) {
      return;
    }
    setErro('');
    try {
      await api.put(`/ordens/${id}/status`, { status });
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function abrirDetalhe(id) {
    setDetalhe(await api.get(`/ordens/${id}`));
  }

  return (
    <div>
      <h2>Ordens de Produção</h2>
      {erro && <div className="erro">{erro}</div>}

      <form className="form-card" onSubmit={criarOrdem}>
        <div className="form-row">
          <label className="full">
            Descrição
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </label>
        </div>
        <div className="form-row">
          <label className="full">
            Observações
            <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </label>
        </div>

        <h3>Materiais a consumir</h3>
        {materiaisSelecionados.map((item, i) => (
          <div className="form-row item-orcamento" key={i}>
            <label className="full">
              Material
              <select value={item.material_id} onChange={(e) => atualizarMaterial(i, 'material_id', e.target.value)}>
                <option value="">Selecione...</option>
                {materiaisDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                step="any"
                value={item.quantidade_usada}
                onChange={(e) => atualizarMaterial(i, 'quantidade_usada', e.target.value)}
              />
            </label>
            <button type="button" onClick={() => removerMaterial(i)}>Remover</button>
          </div>
        ))}
        <div className="form-actions">
          <button type="button" onClick={adicionarMaterial}>+ Adicionar material</button>
        </div>

        <div className="form-actions">
          <button type="submit">Criar ordem de produção</button>
        </div>
      </form>

      <table className="tabela">
        <thead>
          <tr>
            <th>#</th>
            <th>Descrição</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ordens.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.descricao}</td>
              <td><span className={`status status-${o.status}`}>{statusLabel[o.status]}</span></td>
              <td>
                <button type="button" onClick={() => abrirDetalhe(o.id)}>Detalhes</button>
                {o.status === 'pendente' && (
                  <button type="button" onClick={() => mudarStatus(o.id, 'em_producao')}>Iniciar produção</button>
                )}
                {o.status === 'em_producao' && (
                  <button type="button" onClick={() => mudarStatus(o.id, 'concluida')}>Concluir</button>
                )}
                {['pendente', 'em_producao'].includes(o.status) && (
                  <button type="button" onClick={() => mudarStatus(o.id, 'cancelada')}>Cancelar</button>
                )}
              </td>
            </tr>
          ))}
          {ordens.length === 0 && (
            <tr><td colSpan={4}>Nenhuma ordem de produção cadastrada.</td></tr>
          )}
        </tbody>
      </table>

      {detalhe && (
        <div className="modal-fundo" onClick={() => setDetalhe(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ordem #{detalhe.id}</h3>
            <p>{detalhe.descricao}</p>
            <p>{detalhe.observacoes}</p>
            <table className="tabela">
              <thead><tr><th>Material</th><th>Quantidade usada</th><th>Baixado</th></tr></thead>
              <tbody>
                {detalhe.materiais.map((m) => (
                  <tr key={m.id}>
                    <td>{m.material_nome}</td>
                    <td>{m.quantidade_usada} {m.unidade}</td>
                    <td>{m.baixado ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
                {detalhe.materiais.length === 0 && (
                  <tr><td colSpan={3}>Nenhum material vinculado.</td></tr>
                )}
              </tbody>
            </table>
            <button type="button" onClick={() => setDetalhe(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';

const itemVazio = { descricao: '', quantidade: 1, valor_unitario: 0 };

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState([{ ...itemVazio }]);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  async function carregar() {
    setOrcamentos(await api.get('/orcamentos'));
  }

  useEffect(() => {
    carregar();
    api.get('/clientes').then(setClientes);
  }, []);

  function atualizarItem(index, campo, valor) {
    const novos = [...itens];
    novos[index] = { ...novos[index], [campo]: valor };
    setItens(novos);
  }

  function adicionarItem() {
    setItens([...itens, { ...itemVazio }]);
  }

  function removerItem(index) {
    setItens(itens.filter((_, i) => i !== index));
  }

  const total = itens.reduce((soma, item) => soma + Number(item.quantidade || 0) * Number(item.valor_unitario || 0), 0);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!clienteId) {
      setErro('Selecione um cliente');
      return;
    }
    try {
      await api.post('/orcamentos', { cliente_id: clienteId, itens, observacoes });
      setClienteId('');
      setObservacoes('');
      setItens([{ ...itemVazio }]);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function mudarStatus(id, status) {
    await api.put(`/orcamentos/${id}/status`, { status });
    await carregar();
  }

  async function abrirDetalhe(id) {
    setDetalhe(await api.get(`/orcamentos/${id}`));
  }

  async function gerarOrdemProducao(orcamento) {
    const descricao = prompt('Descrição da ordem de produção:', `Produção referente ao orçamento #${orcamento.id}`);
    if (!descricao) return;
    await api.post('/ordens', { orcamento_id: orcamento.id, descricao });
    alert('Ordem de produção criada! Veja em "Ordens de Produção".');
  }

  return (
    <div>
      <h2>Orçamentos</h2>
      {erro && <div className="erro">{erro}</div>}

      <form className="form-card" onSubmit={salvar}>
        <div className="form-row">
          <label>
            Cliente
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <label className="full">
            Observações
            <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </label>
        </div>

        <h3>Itens</h3>
        {itens.map((item, i) => (
          <div className="form-row item-orcamento" key={i}>
            <label className="full">
              Descrição
              <input
                value={item.descricao}
                onChange={(e) => atualizarItem(i, 'descricao', e.target.value)}
                required
              />
            </label>
            <label>
              Quantidade
              <input
                type="number"
                step="any"
                value={item.quantidade}
                onChange={(e) => atualizarItem(i, 'quantidade', e.target.value)}
              />
            </label>
            <label>
              Valor unitário (R$)
              <input
                type="number"
                step="any"
                value={item.valor_unitario}
                onChange={(e) => atualizarItem(i, 'valor_unitario', e.target.value)}
              />
            </label>
            {itens.length > 1 && (
              <button type="button" onClick={() => removerItem(i)}>Remover</button>
            )}
          </div>
        ))}
        <div className="form-actions">
          <button type="button" onClick={adicionarItem}>+ Adicionar item</button>
        </div>

        <p className="total-orcamento">Total: R$ {total.toFixed(2)}</p>
        <div className="form-actions">
          <button type="submit">Criar orçamento</button>
        </div>
      </form>

      <table className="tabela">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orcamentos.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.cliente_nome}</td>
              <td>R$ {Number(o.valor_total).toFixed(2)}</td>
              <td><span className={`status status-${o.status}`}>{o.status}</span></td>
              <td>
                <button type="button" onClick={() => abrirDetalhe(o.id)}>Detalhes</button>
                {o.status === 'orcamento' && (
                  <>
                    <button type="button" onClick={() => mudarStatus(o.id, 'aprovado')}>Aprovar</button>
                    <button type="button" onClick={() => mudarStatus(o.id, 'rejeitado')}>Rejeitar</button>
                  </>
                )}
                {o.status === 'aprovado' && (
                  <button type="button" onClick={() => gerarOrdemProducao(o)}>Gerar ordem de produção</button>
                )}
              </td>
            </tr>
          ))}
          {orcamentos.length === 0 && (
            <tr><td colSpan={5}>Nenhum orçamento cadastrado.</td></tr>
          )}
        </tbody>
      </table>

      {detalhe && (
        <div className="modal-fundo" onClick={() => setDetalhe(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Orçamento #{detalhe.id} - {detalhe.cliente_nome}</h3>
            <p>{detalhe.observacoes}</p>
            <table className="tabela">
              <thead><tr><th>Item</th><th>Qtd</th><th>Valor unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detalhe.itens.map((item) => (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td>{item.quantidade}</td>
                    <td>R$ {Number(item.valor_unitario).toFixed(2)}</td>
                    <td>R$ {(item.quantidade * item.valor_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => setDetalhe(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

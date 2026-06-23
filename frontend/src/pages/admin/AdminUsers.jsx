import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { Search, Shield, ShieldOff, UserCheck, UserX, KeyRound, AlertCircle } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('pt-BR');

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    setError('');
    const p = opts.page ?? page;
    try {
      const params = { page: p, per_page: 20 };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (active !== '') params.is_active = active === 'true';
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
      setPage(res.data.page || p);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, active]);

  useEffect(() => { load({ page: 1 }); /* eslint-disable-next-line */ }, []);

  const applyFilters = () => load({ page: 1 });

  const toggleActive = async (u) => {
    setBusyId(u.id);
    try {
      await adminAPI.patchUser(u.id, { is_active: !u.is_active });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (e) {
      alert(e?.response?.data?.detail || 'Erro ao atualizar o usuário.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleRole = async (u) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Tornar ${u.username} ${next === 'admin' ? 'administrador' : 'usuário comum'}?`)) return;
    setBusyId(u.id);
    try {
      await adminAPI.patchUser(u.id, { role: next });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
    } catch (e) {
      alert(e?.response?.data?.detail || 'Erro ao alterar a função.');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (u) => {
    if (!confirm(`Gerar uma senha temporária para ${u.username}?`)) return;
    setBusyId(u.id);
    try {
      const res = await adminAPI.resetUserPassword(u.id);
      setResetResult({ username: u.username, password: res.data.temporary_password });
    } catch (e) {
      alert(e?.response?.data?.detail || 'Erro ao redefinir a senha.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pg" style={{ maxWidth: '1240px' }}>
      <div className="pg-head">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie contas, planos, consumo e acessos</p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Todas as funções</option>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
        <button className="btn-flat primary" onClick={applyFilters}><Search size={16} /> Filtrar</button>
      </div>

      {error && <div className="pmsg error">{error}</div>}

      <div className="pcard">
        <div className="pcard-body">
          {loading ? (
            <div className="pempty"><p>Carregando...</p></div>
          ) : users.length === 0 ? (
            <div className="pempty"><AlertCircle size={30} className="ico" /><h3>Nenhum usuário</h3><p>Ajuste os filtros.</p></div>
          ) : (
            <table className="ptable">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Plano</th>
                  <th>Consumo (mês)</th>
                  <th>Status</th>
                  <th>Criado</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.username}{u.role === 'admin' && <span className="pbadge blue" style={{ marginLeft: 8 }}>Admin</span>}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td>{u.plan}</td>
                    <td>{fmt(u.queries_used)} / {fmt(u.monthly_limit)}</td>
                    <td>
                      <span className={`pbadge ${u.is_active ? 'green' : 'gray'}`}>{u.is_active ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div className="utable-actions">
                        <button className="btn-icon" title={u.is_active ? 'Desativar' : 'Ativar'} disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                          {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button className="btn-icon" title={u.role === 'admin' ? 'Tornar usuário' : 'Tornar admin'} disabled={busyId === u.id} onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                        </button>
                        <button className="btn-icon" title="Redefinir senha" disabled={busyId === u.id} onClick={() => resetPassword(u)}>
                          <KeyRound size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pager">
            <span>{fmt(total)} usuários · página {page} de {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-flat ghost" disabled={page <= 1 || loading} onClick={() => load({ page: page - 1 })}>Anterior</button>
              <button className="btn-flat ghost" disabled={page >= totalPages || loading} onClick={() => load({ page: page + 1 })}>Próxima</button>
            </div>
          </div>
        </div>
      </div>

      {resetResult && (
        <div className="modal-overlay" onClick={() => setResetResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 10px' }}>Senha temporária gerada</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              Envie esta senha para <strong>{resetResult.username}</strong>. Ela é exibida apenas uma vez.
            </p>
            <div className="keycode"><code>{resetResult.password}</code></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn-flat primary" onClick={() => setResetResult(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

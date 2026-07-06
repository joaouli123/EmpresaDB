import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  CreditCard, Users, Save, AlertCircle, CheckCircle2, Search,
  UserSearch, Layers, FileDown, Eye, Power,
} from 'lucide-react';

const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
const fmt = (n) => (n ?? 0).toLocaleString('pt-BR');

const NUM_FIELDS = [
  { key: 'price_brl', label: 'Preço (R$/mês)', step: '0.01' },
  { key: 'monthly_queries', label: 'Consultas/mês', step: '1' },
  { key: 'rate_per_hour', label: 'Requisições/hora', step: '1' },
  { key: 'burst_per_min', label: 'Burst (req/min)', step: '1' },
  { key: 'max_page_size', label: 'Máx. resultados/página', step: '1' },
];

const TOGGLES = [
  { key: 'can_search', label: 'Busca avançada', icon: Search, hint: 'Endpoint /search com todos os filtros' },
  { key: 'can_socios', label: 'Consulta de sócios', icon: UserSearch, hint: 'QSA e busca de sócios por nome/CPF' },
  { key: 'can_batch', label: 'Consultas em lote', icon: Layers, hint: 'API de processamento em lote' },
  { key: 'can_export', label: 'Exportação de dados', icon: FileDown, hint: 'Exportação de resultados (CSV)' },
  { key: 'is_public', label: 'Visível na página de preços', icon: Eye, hint: 'Aparece para novos assinantes' },
  { key: 'is_active', label: 'Plano ativo', icon: Power, hint: 'Planos inativos não aceitam novas assinaturas' },
];

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getPlans();
      setPlans(res.data.plans || []);
      setDrafts({});
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar os planos.');
    } finally {
      setLoading(false);
    }
  };

  const draftOf = (plan) => ({ ...plan, ...(drafts[plan.id] || {}) });
  const isDirty = (plan) => Boolean(drafts[plan.id] && Object.keys(drafts[plan.id]).length);

  const setField = (planId, key, value) => {
    setDrafts((d) => ({ ...d, [planId]: { ...(d[planId] || {}), [key]: value } }));
  };

  const save = async (plan) => {
    const changes = drafts[plan.id];
    if (!changes) return;
    setSaving(plan.id);
    setError('');
    try {
      const payload = {};
      for (const [k, v] of Object.entries(changes)) {
        payload[k] = ['price_brl'].includes(k) ? parseFloat(v) :
          ['monthly_queries', 'rate_per_hour', 'burst_per_min', 'max_page_size'].includes(k) ? parseInt(v, 10) : v;
      }
      await adminAPI.patchPlan(plan.id, payload);
      setSavedAt(plan.id);
      setTimeout(() => setSavedAt(null), 2500);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erro ao salvar o plano.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Carregando...</p></div>;

  if (error && plans.length === 0) {
    return (
      <div className="pg"><div className="pcard"><div className="pempty">
        <AlertCircle size={34} className="ico" /><h3>Erro ao carregar</h3><p>{error}</p>
        <button className="btn-flat primary" onClick={load}>Tentar novamente</button>
      </div></div></div>
    );
  }

  return (
    <div className="pg" style={{ maxWidth: '1100px' }}>
      <div className="pg-head">
        <div>
          <h1>Planos</h1>
          <p>Configure limites, preços e recursos de cada plano — as mudanças valem para novas requisições em até 1 minuto</p>
        </div>
      </div>

      {error && (
        <div className="docs-callout danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} /> {String(error)}
        </div>
      )}

      {plans.map((plan) => {
        const d = draftOf(plan);
        return (
          <div className="pcard" key={plan.id}>
            <div className="pcard-head plan-head">
              <div className="plan-title">
                <CreditCard size={18} />
                <h2>{plan.display_name}</h2>
                <span className="pbadge gray">{plan.name}</span>
                {!d.is_active && <span className="pbadge red">inativo</span>}
                {d.price_brl > 0
                  ? <span className="pbadge blue">{brl(d.price_brl)}/mês</span>
                  : <span className="pbadge green">grátis</span>}
              </div>
              <span className="plan-subs"><Users size={14} /> {fmt(plan.subscribers)} usuário{plan.subscribers === 1 ? '' : 's'}</span>
            </div>
            <div className="pcard-body">
              <div className="plan-fields">
                {NUM_FIELDS.map((f) => (
                  <label className="plan-field" key={f.key}>
                    <span>{f.label}</span>
                    <input
                      type="number"
                      step={f.step}
                      min="0"
                      value={d[f.key] ?? ''}
                      onChange={(e) => setField(plan.id, f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="plan-toggles">
                {TOGGLES.map((t) => (
                  <label className={`plan-toggle ${d[t.key] ? 'on' : ''}`} key={t.key} title={t.hint}>
                    <input
                      type="checkbox"
                      checked={Boolean(d[t.key])}
                      onChange={(e) => setField(plan.id, t.key, e.target.checked)}
                    />
                    <t.icon size={15} />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>

              <div className="plan-actions">
                {savedAt === plan.id && (
                  <span className="plan-saved"><CheckCircle2 size={15} /> Salvo</span>
                )}
                <button
                  className="btn-flat primary"
                  disabled={!isDirty(plan) || saving === plan.id}
                  onClick={() => save(plan)}
                >
                  <Save size={15} /> {saving === plan.id ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminPlans;

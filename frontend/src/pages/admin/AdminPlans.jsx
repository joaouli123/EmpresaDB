import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  CreditCard, Users, Save, AlertCircle, CheckCircle2, Search,
  UserSearch, Layers, FileDown, Eye, Power, Package, Plus, ShoppingCart,
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

const PKG_FIELDS = [
  { key: 'display_name', label: 'Nome exibido', type: 'text' },
  { key: 'credits', label: 'Créditos', type: 'number', step: '1' },
  { key: 'price_brl', label: 'Preço (R$)', type: 'number', step: '0.01' },
  { key: 'sort_order', label: 'Ordem', type: 'number', step: '1' },
  { key: 'description', label: 'Descrição', type: 'text' },
];

const EMPTY_PKG = { name: '', display_name: '', credits: 1000, price_brl: 49.9, description: '', sort_order: 99 };

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [pkgDrafts, setPkgDrafts] = useState({});
  const [saving, setSaving] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [newPkg, setNewPkg] = useState(null); // null = fechado; objeto = formulário aberto

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resPlans, resPkgs] = await Promise.all([
        adminAPI.getPlans(),
        adminAPI.getBatchPackages().catch(() => ({ data: { packages: [] } })),
      ]);
      setPlans(resPlans.data.plans || []);
      setPackages(resPkgs.data.packages || []);
      setDrafts({});
      setPkgDrafts({});
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

  // ---- pacotes de créditos em lote ----
  const pkgDraftOf = (pkg) => ({ ...pkg, ...(pkgDrafts[pkg.id] || {}) });
  const pkgIsDirty = (pkg) => Boolean(pkgDrafts[pkg.id] && Object.keys(pkgDrafts[pkg.id]).length);
  const setPkgField = (id, key, value) => {
    setPkgDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), [key]: value } }));
  };

  const savePkg = async (pkg) => {
    const changes = pkgDrafts[pkg.id];
    if (!changes) return;
    setSaving(`pkg-${pkg.id}`);
    setError('');
    try {
      const payload = {};
      for (const [k, v] of Object.entries(changes)) {
        payload[k] = k === 'price_brl' ? parseFloat(v) :
          ['credits', 'sort_order'].includes(k) ? parseInt(v, 10) : v;
      }
      await adminAPI.patchBatchPackage(pkg.id, payload);
      setSavedAt(`pkg-${pkg.id}`);
      setTimeout(() => setSavedAt(null), 2500);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erro ao salvar o pacote.');
    } finally {
      setSaving(null);
    }
  };

  const createPkg = async () => {
    if (!newPkg?.display_name || !newPkg?.credits || !newPkg?.price_brl) {
      setError('Preencha nome, créditos e preço do novo pacote.');
      return;
    }
    setSaving('pkg-new');
    setError('');
    try {
      await adminAPI.createBatchPackage({
        ...newPkg,
        name: newPkg.name || newPkg.display_name,
        credits: parseInt(newPkg.credits, 10),
        price_brl: parseFloat(newPkg.price_brl),
        sort_order: parseInt(newPkg.sort_order, 10) || 99,
      });
      setNewPkg(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erro ao criar o pacote.');
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

      {/* ---------- Pacotes de créditos em lote ---------- */}
      <div className="pg-head" style={{ marginTop: 32 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>Pacotes de créditos em lote</h1>
          <p>Compra avulsa (pagamento único). Alterar preço/créditos recria o produto no Stripe automaticamente na próxima compra</p>
        </div>
        <button className="btn-flat primary" onClick={() => setNewPkg(newPkg ? null : { ...EMPTY_PKG })}>
          <Plus size={15} /> Novo pacote
        </button>
      </div>

      {newPkg && (
        <div className="pcard">
          <div className="pcard-head plan-head">
            <div className="plan-title"><Package size={18} /><h2>Novo pacote</h2></div>
          </div>
          <div className="pcard-body">
            <div className="plan-fields">
              {PKG_FIELDS.map((f) => (
                <label className="plan-field" key={f.key}>
                  <span>{f.label}</span>
                  <input
                    type={f.type}
                    step={f.step}
                    min="0"
                    value={newPkg[f.key] ?? ''}
                    onChange={(e) => setNewPkg((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="plan-actions">
              <button className="btn-flat" onClick={() => setNewPkg(null)}>Cancelar</button>
              <button className="btn-flat primary" disabled={saving === 'pkg-new'} onClick={createPkg}>
                <Save size={15} /> {saving === 'pkg-new' ? 'Criando...' : 'Criar pacote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {packages.map((pkg) => {
        const d = pkgDraftOf(pkg);
        const perUnit = (parseFloat(d.price_brl) || 0) / Math.max(parseInt(d.credits, 10) || 1, 1);
        return (
          <div className="pcard" key={`pkg-${pkg.id}`}>
            <div className="pcard-head plan-head">
              <div className="plan-title">
                <Package size={18} />
                <h2>{pkg.display_name}</h2>
                <span className="pbadge gray">{pkg.name}</span>
                {!d.is_active && <span className="pbadge red">inativo</span>}
                <span className="pbadge blue">{brl(d.price_brl)}</span>
                <span className="pbadge green">R$ {perUnit.toFixed(4).replace('.', ',')}/crédito</span>
              </div>
              <span className="plan-subs"><ShoppingCart size={14} /> {fmt(pkg.purchases)} venda{pkg.purchases === 1 ? '' : 's'}</span>
            </div>
            <div className="pcard-body">
              <div className="plan-fields">
                {PKG_FIELDS.map((f) => (
                  <label className="plan-field" key={f.key}>
                    <span>{f.label}</span>
                    <input
                      type={f.type}
                      step={f.step}
                      min="0"
                      value={d[f.key] ?? ''}
                      onChange={(e) => setPkgField(pkg.id, f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="plan-toggles">
                <label className={`plan-toggle ${d.is_active ? 'on' : ''}`} title="Pacotes inativos somem da vitrine e não podem ser comprados">
                  <input
                    type="checkbox"
                    checked={Boolean(d.is_active)}
                    onChange={(e) => setPkgField(pkg.id, 'is_active', e.target.checked)}
                  />
                  <Power size={15} />
                  <span>Pacote ativo</span>
                </label>
              </div>

              <div className="plan-actions">
                {savedAt === `pkg-${pkg.id}` && (
                  <span className="plan-saved"><CheckCircle2 size={15} /> Salvo</span>
                )}
                <button
                  className="btn-flat primary"
                  disabled={!pkgIsDirty(pkg) || saving === `pkg-${pkg.id}`}
                  onClick={() => savePkg(pkg)}
                >
                  <Save size={15} /> {saving === `pkg-${pkg.id}` ? 'Salvando...' : 'Salvar alterações'}
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

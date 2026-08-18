import './App.css';

function App() {
  return (
    <div className="container mt-base mb-base">
      
      {/* Header Showcase */}
      <header className="flex items-center justify-between card mb-base" style={{ borderRadius: 'var(--radius-circle)', padding: 'var(--spacing-sm) var(--spacing-base)'}}>
        <div className="flex items-center">
          <span className="text-h3" style={{ color: 'var(--primary-dark)', margin: 0}}>Bioma PetShop</span>
        </div>
        <div className="nav-pill">
          <span>Painel Principal</span>
          <span className="nav-item">Prontuários</span>
        </div>
      </header>

      <div className="text-center mb-base mt-base">
        <h1 className="text-display">Guia de Estilos Visuais</h1>
        <p className="text-body-lg" style={{ color: 'var(--slate)' }}>
          Identidade inspirada na natureza para gestão de bem-estar pet.
        </p>
      </div>

      {/* Typography Showcase */}
      <section className="showcase-section">
        <h2 className="text-h2 showcase-title">Tipografia</h2>
        <div className="card flex flex-col gap-base">
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Display</p><span className="text-display">Bioma PetShop</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>H1</p><span className="text-h1">Título Principal</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>H2</p><span className="text-h2">Subtítulo</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>H3</p><span className="text-h3">Seção</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Body Large</p><span className="text-body-lg">Texto destaque do corpo</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Body</p><span className="text-body">Texto padrão do corpo da interface. A rápida raposa marrom pula sobre o cão preguiçoso.</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Body Small</p><span className="text-body-sm">Texto secundário de apoio.</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Caption</p><span className="text-caption">Legendas e microtextos.</span></div>
          <div><p className="text-caption" style={{color: 'var(--gray)'}}>Micro</p><span className="text-micro">Label maiúsculo</span></div>
        </div>
      </section>

      {/* Buttons Showcase */}
      <section className="showcase-section">
        <h2 className="text-h2 showcase-title">Botões</h2>
        <div className="card flex gap-base flex-wrap items-center">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Outlined</button>
          <button className="btn btn-accent">Accent Mint</button>
          <button className="btn btn-danger">Danger Terra</button>
        </div>
      </section>

      {/* Inputs Showcase */}
      <section className="showcase-section">
        <h2 className="text-h2 showcase-title">Campos de Entrada</h2>
        <div className="card component-grid">
          <div className="form-group">
            <label className="input-label">Nome do Pet</label>
            <input type="text" className="input-field" placeholder="Ex: Thor, Mel" />
          </div>
          <div className="form-group">
            <label className="input-label">Nome do Tutor</label>
            <input type="text" className="input-field" defaultValue="Carlos Silva" />
          </div>
          <div className="form-group">
            <label className="input-label">Telefone</label>
            <input type="text" className="input-field" placeholder="Telefone Inválido" style={{borderColor: 'var(--warm-terra)'}} />
          </div>
        </div>
      </section>

      {/* Cards & Badges Showcase */}
      <section className="showcase-section">
        <h2 className="text-h2 showcase-title">Cartões e Etiquetas</h2>
        <div className="component-grid">
          
          <div className="card flex flex-col gap-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-h3">Consulta Veterinária</h3>
              <span className="badge badge-success">Hoje</span>
            </div>
            <p className="text-body-sm" style={{color: 'var(--slate)'}}>Check-up preventivo do paciente Snoopy (Beagle).</p>
          </div>

          <div className="card flex flex-col justify-between">
            <span className="text-body-sm" style={{color: 'var(--slate)'}}>Pets atendidos</span>
            <div className="flex items-center gap-sm">
              <span className="text-h1">1,248</span>
              <span className="text-caption" style={{color: 'var(--primary-medium)'}}>+12% este mês</span>
            </div>
          </div>

          <div className="card flex flex-col gap-sm">
            <span className="text-body-sm" style={{color: 'var(--slate)'}}>Status de Cirurgia</span>
            <div className="flex gap-sm">
              <span className="badge badge-success">Ativo</span>
              <span className="badge badge-info">Inativo</span>
              <span className="badge badge-warning">Pendente</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default App;

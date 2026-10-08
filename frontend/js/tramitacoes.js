const API_BASE_URL = 'http://127.0.0.1:8000';

// Guardar tramitações carregadas para pesquisa local
let listaTramitacoes = [];
let idTramitacaoEmEdicao = null;

// =========================================================================
// 1. INICIALIZAÇÃO E EVENTOS
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarUtilizadorLogado();
    carregarTramitacoes();
    configurarEventosModais();
    configurarPesquisa();
});

function obterHeaders() {
    const token =
        localStorage.getItem('sgd_token') ||
        localStorage.getItem('access_token');

    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// =========================================================================
// 2. CARREGAR DADOS DO UTILIZADOR (/auth/me)
// =========================================================================

async function carregarUtilizadorLogado() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: obterHeaders()
        });

        if (response.ok) {
            const payload = await response.json();
            const user = payload.utilizador || payload;

            const elNome = document.getElementById('nome-utilizador');
            const elPerfil = document.getElementById('perfil-utilizador');

            if (elNome) elNome.textContent = user.username || 'Utilizador';
            if (elPerfil) elPerfil.textContent = user.perfil || 'Perfil';
        }
    } catch (erro) {
        console.warn('Não foi possível obter dados do utilizador actual:', erro);
    }
}

// =========================================================================
// 3. LISTAGEM DE TRAMITAÇÕES (GET /tramitacoes/)
// =========================================================================

async function carregarTramitacoes() {
    const tbody = document.getElementById('tramitacoes-body');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/`, {
            method: 'GET',
            headers: obterHeaders()
        });

        if (response.status === 401) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao obter dados.`);
        }

        listaTramitacoes = await response.json();
        renderizarTabela(listaTramitacoes);

    } catch (erro) {
        console.error('Erro em carregarTramitacoes:', erro);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-danger" style="text-align:center; padding: 20px;">
                    Erro ao carregar tramitações. Verifique a ligação com o servidor.
                </td>
            </tr>
        `;
    }
}

function renderizarTabela(dados) {
    const tbody = document.getElementById('tramitacoes-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 20px;">
                    Nenhuma tramitação encontrada.
                </td>
            </tr>
        `;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');

        const dataFormatada = item.data_encaminhamento
            ? new Date(item.data_encaminhamento).toLocaleDateString('pt-PT')
            : '-';

        const docId = item.documento_id ?? '-';
        const origem = item.origem_departamento_id ?? '-';
        const destino = item.destino_departamento_id ?? '-';

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${docId}</td>
            <td>${origem}</td>
            <td>${destino}</td>
            <td>${dataFormatada}</td>
            <td>
                <span class="badge badge-${obterClasseEstado(item.estado)}">
                    ${formatarEstado(item.estado)}
                </span>
            </td>
            <td>${item.observacao || '-'}</td>
            <td>
                <button class="btn-icon" onclick="abrirModalVer(${item.id})" title="Ver Detalhes">👁️</button>
                <button class="btn-icon" onclick="abrirModalEditar(${item.id})" title="Editar">✏️</button>
                <button class="btn-icon" onclick="eliminarTramitacao(${item.id})" title="Eliminar">🗑️</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function obterClasseEstado(estado) {
    switch ((estado || '').toLowerCase()) {
        case 'pendente':
            return 'warning';
        case 'em_analise':
            return 'info';
        case 'concluido':
            return 'success';
        default:
            return 'secondary';
    }
}

function formatarEstado(estado) {
    switch ((estado || '').toLowerCase()) {
        case 'pendente':
            return 'Pendente';
        case 'em_analise':
            return 'Em Análise';
        case 'concluido':
            return 'Concluído';
        default:
            return estado || '-';
    }
}

// =========================================================================
// 4. CRIAR NOVA TRAMITAÇÃO (POST /tramitacoes/)
// =========================================================================

async function guardarNovaTramitacao(event) {
    event.preventDefault();

    const msgEl = document.getElementById('mensagem-tramitacao');
    if (!msgEl) return;

    msgEl.textContent = '';
    msgEl.className = 'form-message';

    const payload = {
        documento_id: Number(document.getElementById('documento_id').value),
        origem_departamento_id: document.getElementById('origem_departamento_id').value
            ? Number(document.getElementById('origem_departamento_id').value)
            : null,
        destino_departamento_id: document.getElementById('destino_departamento_id').value
            ? Number(document.getElementById('destino_departamento_id').value)
            : null,
        estado: document.getElementById('estado-tramitacao').value,
        observacao: document.getElementById('observacao-tramitacao').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/`, {
            method: 'POST',
            headers: obterHeaders(),
            body: JSON.stringify(payload)
        });

        const errData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(errData.detail || 'Erro ao registar a tramitação.');
        }

        fecharModal('modal-tramitacao');
        document.getElementById('form-tramitacao').reset();
        await carregarTramitacoes();

    } catch (erro) {
        msgEl.textContent = erro.message;
        msgEl.classList.add('error');
    }
}

// =========================================================================
// 5. VER DETALHES DA TRAMITAÇÃO (GET /tramitacoes/{id})
// =========================================================================

async function abrirModalVer(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/${id}`, {
            method: 'GET',
            headers: obterHeaders()
        });

        if (!response.ok) {
            throw new Error('Não foi possível obter os detalhes da tramitação.');
        }

        const item = await response.json();

        document.getElementById('ver-tramitacao-id').textContent = item.id ?? '-';
        document.getElementById('ver-documento-id').textContent = item.documento_id ?? '-';
        document.getElementById('ver-origem').textContent = item.origem_departamento_id ?? '-';
        document.getElementById('ver-destino').textContent = item.destino_departamento_id ?? '-';
        document.getElementById('ver-encaminhado-por').textContent = item.encaminhado_por ?? '-';
        document.getElementById('ver-data-tramitacao').textContent = item.data_encaminhamento ?? '-';
        document.getElementById('ver-estado-tramitacao').textContent = formatarEstado(item.estado);
        document.getElementById('ver-observacao').textContent = item.observacao || '-';

        abrirModal('modal-ver-tramitacao');

    } catch (erro) {
        alert(erro.message);
    }
}

// =========================================================================
// 6. EDITAR TRAMITAÇÃO (PUT /tramitacoes/{id})
// =========================================================================

async function abrirModalEditar(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/${id}`, {
            method: 'GET',
            headers: obterHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados para edição.');
        }

        const item = await response.json();
        idTramitacaoEmEdicao = id;

        document.getElementById('editar-origem_departamento_id').value = item.origem_departamento_id ?? '';
        document.getElementById('editar-destino_departamento_id').value = item.destino_departamento_id ?? '';
        document.getElementById('editar-estado-tramitacao').value = item.estado || 'pendente';
        document.getElementById('editar-observacao-tramitacao').value = item.observacao || '';

        const msgEl = document.getElementById('mensagem-editar-tramitacao');
        if (msgEl) msgEl.textContent = '';

        abrirModal('modal-editar-tramitacao');

    } catch (erro) {
        alert(erro.message);
    }
}

async function guardarEdicaoTramitacao(event) {
    event.preventDefault();

    if (!idTramitacaoEmEdicao) return;

    const msgEl = document.getElementById('mensagem-editar-tramitacao');
    if (!msgEl) return;

    msgEl.textContent = '';
    msgEl.className = 'form-message';

    const payload = {
        origem_departamento_id: document.getElementById('editar-origem_departamento_id').value
            ? Number(document.getElementById('editar-origem_departamento_id').value)
            : null,
        destino_departamento_id: document.getElementById('editar-destino_departamento_id').value
            ? Number(document.getElementById('editar-destino_departamento_id').value)
            : null,
        estado: document.getElementById('editar-estado-tramitacao').value,
        observacao: document.getElementById('editar-observacao-tramitacao').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/${idTramitacaoEmEdicao}`, {
            method: 'PUT',
            headers: obterHeaders(),
            body: JSON.stringify(payload)
        });

        const errData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(errData.detail || 'Erro ao actualizar a tramitação.');
        }

        fecharModal('modal-editar-tramitacao');
        idTramitacaoEmEdicao = null;
        await carregarTramitacoes();

    } catch (erro) {
        msgEl.textContent = erro.message;
        msgEl.classList.add('error');
    }
}

// =========================================================================
// 7. ELIMINAR TRAMITAÇÃO (DELETE /tramitacoes/{id})
// =========================================================================

async function eliminarTramitacao(id) {
    if (!confirm(`Tem certeza que deseja eliminar a tramitação #${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tramitacoes/${id}`, {
            method: 'DELETE',
            headers: obterHeaders()
        });

        const errData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(errData.detail || 'Não foi possível eliminar a tramitação.');
        }

        await carregarTramitacoes();

    } catch (erro) {
        alert(erro.message);
    }
}

// =========================================================================
// 8. CONTROLO DOS MODAIS E PESQUISA
// =========================================================================

function abrirModal(idModal) {
    const el = document.getElementById(idModal);
    if (el) el.classList.add('active');
}

function fecharModal(idModal) {
    const el = document.getElementById(idModal);
    if (el) el.classList.remove('active');
}

function configurarEventosModais() {
    const btnNovo = document.getElementById('botao-nova-tramitacao');
    if (btnNovo) btnNovo.addEventListener('click', () => abrirModal('modal-tramitacao'));

    const btnFecharNovo = document.getElementById('fechar-modal-tramitacao');
    const btnCancelarNovo = document.getElementById('cancelar-tramitacao');
    if (btnFecharNovo) btnFecharNovo.addEventListener('click', () => fecharModal('modal-tramitacao'));
    if (btnCancelarNovo) btnCancelarNovo.addEventListener('click', () => fecharModal('modal-tramitacao'));

    const formNovo = document.getElementById('form-tramitacao');
    if (formNovo) formNovo.addEventListener('submit', guardarNovaTramitacao);

    const btnFecharVer = document.getElementById('fechar-modal-ver-tramitacao');
    const btnCancelarVer = document.getElementById('fechar-tramitacao');
    if (btnFecharVer) btnFecharVer.addEventListener('click', () => fecharModal('modal-ver-tramitacao'));
    if (btnCancelarVer) btnCancelarVer.addEventListener('click', () => fecharModal('modal-ver-tramitacao'));

    const btnFecharEditar = document.getElementById('fechar-modal-editar-tramitacao');
    const btnCancelarEditar = document.getElementById('cancelar-edicao-tramitacao');
    if (btnFecharEditar) btnFecharEditar.addEventListener('click', () => fecharModal('modal-editar-tramitacao'));
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', () => fecharModal('modal-editar-tramitacao'));

    const formEditar = document.getElementById('form-editar-tramitacao');
    if (formEditar) formEditar.addEventListener('submit', guardarEdicaoTramitacao);
}

function configurarPesquisa() {
    const campoPesquisa = document.getElementById('pesquisa-tramitacoes');
    if (!campoPesquisa) return;

    campoPesquisa.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();

        if (!termo) {
            renderizarTabela(listaTramitacoes);
            return;
        }

        const filtrados = listaTramitacoes.filter(item => {
            const id = String(item.id || '');
            const doc = String(item.documento_id || '');
            const obs = String(item.observacao || '').toLowerCase();
            const est = String(item.estado || '').toLowerCase();

            return id.includes(termo) || doc.includes(termo) || obs.includes(termo) || est.includes(termo);
        });

        renderizarTabela(filtrados);
    });
}
const API_BASE_URL = 'http://127.0.0.1:8000';

let documentoActivoId = null;

// =========================================================================
// 1. INICIALIZAÇÃO E EVENTOS
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarUtilizadorLogado();
    configurarEventos();

    const urlParams = new URLSearchParams(window.location.search);
    const docIdQuery = urlParams.get('documento_id');

    if (docIdQuery) {
        document.getElementById('documento-id-select').value = docIdQuery;
        carregarAnexosDoDocumento(docIdQuery);
    }
});

function obterHeadersJSON() {
    const token =
        localStorage.getItem('sgd_token') ||
        localStorage.getItem('access_token');

    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

function obterHeadersAuth() {
    const token =
        localStorage.getItem('sgd_token') ||
        localStorage.getItem('access_token');

    return {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// =========================================================================
// 2. UTILIZADOR ACTUAL
// =========================================================================

async function carregarUtilizadorLogado() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: obterHeadersJSON()
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
        console.warn('Erro ao carregar utilizador:', erro);
    }
}

// =========================================================================
// 3. LISTAR ANEXOS (GET /anexos/documento/{documento_id})
// =========================================================================

async function carregarAnexosDoDocumento(documentoId) {
    const tbody = document.getElementById('anexos-body');
    const btnUpload = document.getElementById('btn-abrir-modal-upload');

    if (!documentoId) {
        alert('Por favor, introduza um ID de Documento válido.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/anexos/documento/${documentoId}`, {
            method: 'GET',
            headers: obterHeadersJSON()
        });

        if (response.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/login';
            return;
        }

        if (response.status === 404) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color: red; padding: 20px;">
                        Documento #${documentoId} não encontrado.
                    </td>
                </tr>
            `;
            if (btnUpload) btnUpload.disabled = true;
            documentoActivoId = null;
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao buscar anexos.`);
        }

        const anexos = await response.json();
        documentoActivoId = parseInt(documentoId);

        if (btnUpload) btnUpload.disabled = false;

        renderizarTabelaAnexos(anexos);

    } catch (erro) {
        console.error('Erro em carregarAnexosDoDocumento:', erro);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger" style="text-align:center; padding: 20px;">
                    Erro ao carregar anexos.
                </td>
            </tr>
        `;
    }
}

function renderizarTabelaAnexos(anexos) {
    const tbody = document.getElementById('anexos-body');
    tbody.innerHTML = '';

    if (!anexos || anexos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 20px;">
                    Nenhum anexo associado a este documento.
                </td>
            </tr>
        `;
        return;
    }

    anexos.forEach(item => {
        const tr = document.createElement('tr');

        const tamanhoKB = item.tamanho_bytes
            ? (item.tamanho_bytes / 1024).toFixed(2) + ' KB'
            : '-';

        const dataUploadFormatada = item.data_upload
            ? new Date(item.data_upload).toLocaleString('pt-PT')
            : '-';

        tr.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.nome_original}</strong></td>
            <td>${item.tipo_ficheiro || 'Desconhecido'}</td>
            <td>${tamanhoKB}</td>
            <td>${dataUploadFormatada}</td>
            <td>
                <button class="btn-icon" onclick="descarregarAnexo(${item.id}, '${item.nome_original}')" title="Descarregar">⬇️</button>
                <button class="btn-icon" onclick="eliminarAnexo(${item.id})" title="Eliminar">🗑️</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// =========================================================================
// 4. CARREGAR ANEXO / UPLOAD (POST /anexos/upload/{documento_id})
// =========================================================================

async function enviarAnexo(event) {
    event.preventDefault();

    if (!documentoActivoId) {
        alert('Selecione primeiro um documento válido.');
        return;
    }

    const inputFicheiro = document.getElementById('ficheiro-input');
    const msgEl = document.getElementById('mensagem-upload');
    const btnSubmit = document.getElementById('btn-enviar-ficheiro');

    if (!inputFicheiro.files || inputFicheiro.files.length === 0) {
        msgEl.textContent = 'Por favor, selecione um ficheiro.';
        msgEl.className = 'form-message error';
        return;
    }

    const formData = new FormData();
    formData.append('ficheiro', inputFicheiro.files[0]);

    msgEl.textContent = 'A enviar ficheiro...';
    msgEl.className = 'form-message info';
    btnSubmit.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/anexos/upload/${documentoActivoId}`, {
            method: 'POST',
            headers: obterHeadersAuth(),
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Erro ao carregar o anexo.');
        }

        fecharModal('modal-upload-anexo');
        document.getElementById('form-upload-anexo').reset();
        carregarAnexosDoDocumento(documentoActivoId);

    } catch (erro) {
        msgEl.textContent = erro.message;
        msgEl.className = 'form-message error';
    } finally {
        btnSubmit.disabled = false;
    }
}

// =========================================================================
// 5. DOWNLOAD DE ANEXO (GET /anexos/download/{anexo_id})
// =========================================================================

async function descarregarAnexo(anexoId, nomeOriginal) {
    try {
        const response = await fetch(`${API_BASE_URL}/anexos/download/${anexoId}`, {
            method: 'GET',
            headers: obterHeadersAuth()
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: 'Erro no download.' }));
            throw new Error(errData.detail || 'Não foi possível descarregar o ficheiro.');
        }

        const blob = await response.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = nomeOriginal || `anexo_${anexoId}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);

    } catch (erro) {
        alert(`Erro ao transferir ficheiro: ${erro.message}`);
    }
}

// =========================================================================
// 6. ELIMINAR ANEXO (DELETE /anexos/{anexo_id})
// =========================================================================

async function eliminarAnexo(anexoId) {
    if (!confirm(`Tem certeza que deseja eliminar o anexo #${anexoId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/anexos/${anexoId}`, {
            method: 'DELETE',
            headers: obterHeadersJSON()
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Erro ao eliminar o anexo.');
        }

        carregarAnexosDoDocumento(documentoActivoId);

    } catch (erro) {
        alert(erro.message);
    }
}

// =========================================================================
// 7. CONTROLO DOS MODAIS E EVENTOS
// =========================================================================

function abrirModal(idModal) {
    const el = document.getElementById(idModal);
    if (el) el.classList.add('active');
}

function fecharModal(idModal) {
    const el = document.getElementById(idModal);
    if (el) el.classList.remove('active');
}

function configurarEventos() {
    const btnCarregar = document.getElementById('btn-carregar-anexos');
    if (btnCarregar) {
        btnCarregar.addEventListener('click', () => {
            const docId = document.getElementById('documento-id-select').value;
            carregarAnexosDoDocumento(docId);
        });
    }

    const btnAbrirModal = document.getElementById('btn-abrir-modal-upload');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            if (documentoActivoId) {
                document.getElementById('upload-doc-id-label').textContent = documentoActivoId;
                document.getElementById('mensagem-upload').textContent = '';
                abrirModal('modal-upload-anexo');
            }
        });
    }

    const btnFechar = document.getElementById('fechar-modal-upload');
    const btnCancelar = document.getElementById('cancelar-upload');

    if (btnFechar) btnFechar.addEventListener('click', () => fecharModal('modal-upload-anexo'));
    if (btnCancelar) btnCancelar.addEventListener('click', () => fecharModal('modal-upload-anexo'));

    const formUpload = document.getElementById('form-upload-anexo');
    if (formUpload) formUpload.addEventListener('submit', enviarAnexo);
}
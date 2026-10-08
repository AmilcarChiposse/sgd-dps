function obterTokenAutenticacao() {
    return localStorage.getItem("sgd_token") || localStorage.getItem("access_token");
}

const token = obterTokenAutenticacao();

if (!token) {
    window.location.href = "/login";
}


let documentos = [];


// =====================================================
// CARREGAR DOCUMENTOS
// =====================================================

async function carregarDocumentos() {

    const corpoTabela =
        document.getElementById("documents-body");

    try {

        const resposta = await fetch("/documentos/", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });


        if (resposta.status === 401) {

            localStorage.removeItem("sgd_token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("sgd_utilizador");

            window.location.href = "/login";

            return;
        }


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar os documentos."
            );

        }


        documentos = await resposta.json();

        mostrarDocumentos(documentos);

    }

    catch (erro) {

        console.error(erro);

        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    ${erro.message}
                </td>
            </tr>
        `;

    }
}


// =====================================================
// MOSTRAR DOCUMENTOS
// =====================================================

function mostrarDocumentos(lista) {

    const corpoTabela =
        document.getElementById("documents-body");

    corpoTabela.innerHTML = "";


    if (lista.length === 0) {

        corpoTabela.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    Nenhum documento encontrado.
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(documento => {

        const linha =
            document.createElement("tr");


        // ESTADO

        let estadoClasse =
            "status-recebido";

        let estadoTexto =
            documento.estado;


        if (documento.estado === "em_analise") {

            estadoClasse = "status-analise";
            estadoTexto = "Em análise";

        }

        else if (documento.estado === "concluido") {

            estadoClasse = "status-concluido";
            estadoTexto = "Concluído";

        }

        else if (documento.estado === "recebido") {

            estadoTexto = "Recebido";

        }


        // PRIORIDADE

        let prioridadeClasse =
            "priority-normal";


        if (documento.prioridade === "alta") {

            prioridadeClasse =
                "priority-alta";

        }

        else if (documento.prioridade === "urgente") {

            prioridadeClasse =
                "priority-urgente";

        }


        linha.innerHTML = `

            <td>
                <span class="document-number">
                    ${documento.numero_entrada}
                </span>
            </td>

            <td>
                ${documento.tipo}
            </td>

            <td>
                ${documento.assunto}
            </td>

            <td>
                ${documento.remetente}
            </td>

            <td>
                ${documento.data_rececao}
            </td>

            <td>
                <span class="priority ${prioridadeClasse}">
                    ${documento.prioridade}
                </span>
            </td>

            <td>
                <span class="status ${estadoClasse}">
                    ${estadoTexto}
                </span>
            </td>

            <td>

                <div class="document-actions">

                    <button
                        type="button"
                        class="btn-action btn-view"
                        data-id="${documento.id}"
                        title="Ver documento"
                    >
                        👁
                    </button>

                    <button
                        type="button"
                        class="btn-action btn-edit"
                        data-id="${documento.id}"
                        title="Editar documento"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="btn-action btn-delete"
                        data-id="${documento.id}"
                        title="Eliminar documento"
                    >
                        🗑
                    </button>

                </div>

            </td>

        `;


        corpoTabela.appendChild(linha);

    });

}


// =====================================================
// PESQUISA
// =====================================================

function configurarPesquisa() {

    const campo =
        document.getElementById(
            "pesquisa-documentos"
        );

    const botaoPesquisar =
        document.getElementById(
            "botao-pesquisar"
        );

    const botaoLimpar =
        document.getElementById(
            "botao-limpar"
        );


    if (!campo) {
        return;
    }


    function pesquisar() {

        const termo =
            campo.value
                .toLowerCase()
                .trim();


        if (!termo) {

            mostrarDocumentos(documentos);

            return;
        }


        const filtrados =
            documentos.filter(documento => {

                return (

                    (documento.numero_entrada || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    (documento.tipo || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    (documento.assunto || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    (documento.remetente || "")
                        .toLowerCase()
                        .includes(termo)

                );

            });


        mostrarDocumentos(filtrados);

    }


    if (botaoPesquisar) {

        botaoPesquisar.addEventListener(
            "click",
            pesquisar
        );

    }


    if (botaoLimpar) {

        botaoLimpar.addEventListener(
            "click",
            function () {

                campo.value = "";

                mostrarDocumentos(documentos);

                campo.focus();

            }
        );

    }


    campo.addEventListener(
        "keydown",
        function (evento) {

            if (evento.key === "Enter") {

                pesquisar();

            }

        }
    );

}


// =====================================================
// UTILIZADOR ACTUAL
// =====================================================

function carregarUtilizador() {

    const dados =
        localStorage.getItem(
            "sgd_utilizador"
        );


    if (!dados) {
        return;
    }


    const utilizador =
        JSON.parse(dados);


    const nome =
        document.querySelector(
            ".user-area strong"
        );


    const perfil =
        document.querySelector(
            ".user-area small"
        );


    const avatar =
        document.querySelector(
            ".user-avatar"
        );


    if (nome) {

        nome.textContent =
            utilizador.nome_completo ||
            utilizador.username;

    }


    if (perfil) {

        perfil.textContent =
            utilizador.perfil;

    }


    if (avatar) {

        const nomeCompleto =
            utilizador.nome_completo ||
            utilizador.username ||
            "U";


        avatar.textContent =
            nomeCompleto
                .charAt(0)
                .toUpperCase();

    }

}


// =====================================================
// NOVO DOCUMENTO
// =====================================================

function configurarNovoDocumento() {

    const botaoNovo =
        document.getElementById(
            "botao-novo-documento"
        );


    const modal =
        document.getElementById(
            "modal-documento"
        );


    const fecharModal =
        document.getElementById(
            "fechar-modal"
        );


    const cancelar =
        document.getElementById(
            "cancelar-documento"
        );


    const formulario =
        document.getElementById(
            "form-documento"
        );


    const mensagem =
        document.getElementById(
            "mensagem-documento"
        );


    const botaoGuardar =
        document.getElementById(
            "guardar-documento"
        );


    if (!botaoNovo || !modal || !formulario) {
        return;
    }


    function abrirModal() {

        modal.classList.add("active");

        formulario.reset();

        mensagem.className =
            "form-message";

        mensagem.textContent = "";

        document.getElementById(
            "numero_entrada"
        ).focus();

    }


    function fechar() {

        modal.classList.remove("active");

        formulario.reset();

        mensagem.className =
            "form-message";

        mensagem.textContent = "";

    }


    botaoNovo.addEventListener(
        "click",
        abrirModal
    );


    fecharModal.addEventListener(
        "click",
        fechar
    );


    cancelar.addEventListener(
        "click",
        fechar
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (evento.target === modal) {
                fechar();
            }

        }
    );


    formulario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            mensagem.className =
                "form-message";

            mensagem.textContent = "";


            botaoGuardar.disabled = true;

            botaoGuardar.textContent =
                "A guardar...";


            const dados =
                obterDadosFormulario();


            try {

                const resposta =
                    await fetch(
                        "/documentos/",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(dados)

                        }
                    );


                const resultado =
                    await resposta.json();


                if (resposta.status === 401) {

                    terminarSessao();

                    return;

                }


                if (!resposta.ok) {

                    throw new Error(
                        resultado.detail ||
                        "Não foi possível registar o documento."
                    );

                }


                mensagem.className =
                    "form-message success";


                mensagem.textContent =
                    "Documento registado com sucesso.";


                await carregarDocumentos();


                setTimeout(
                    fechar,
                    800
                );

            }

            catch (erro) {

                console.error(erro);

                mensagem.className =
                    "form-message error";

                mensagem.textContent =
                    erro.message;

            }

            finally {

                botaoGuardar.disabled = false;

                botaoGuardar.textContent =
                    "Guardar documento";

            }

        }
    );

}


// =====================================================
// OBTER DADOS DO FORMULÁRIO
// =====================================================

function obterDadosFormulario() {

    return {

        numero_entrada:
            document.getElementById(
                "numero_entrada"
            ).value.trim(),

        tipo:
            document.getElementById(
                "tipo"
            ).value.trim(),

        assunto:
            document.getElementById(
                "assunto"
            ).value.trim(),

        remetente:
            document.getElementById(
                "remetente"
            ).value.trim(),

        destinatario:
            document.getElementById(
                "destinatario"
            ).value.trim() || null,

        data_documento:
            document.getElementById(
                "data_documento"
            ).value || null,

        data_rececao:
            document.getElementById(
                "data_rececao"
            ).value,

        prioridade:
            document.getElementById(
                "prioridade"
            ).value,

        estado:
            document.getElementById(
                "estado"
            ).value,

        departamento_id:
            document.getElementById(
                "departamento_id"
            ).value
                ? Number(
                    document.getElementById(
                        "departamento_id"
                    ).value
                )
                : null

    };

}


// =====================================================
// VER DOCUMENTO
// =====================================================

function configurarVisualizacaoDocumento() {

    const modal =
        document.getElementById(
            "modal-ver-documento"
        );


    const fecharModal =
        document.getElementById(
            "fechar-modal-ver"
        );


    const fecharDocumento =
        document.getElementById(
            "fechar-documento"
        );


    if (!modal) {
        return;
    }


    function fechar() {

        modal.classList.remove(
            "active"
        );

    }


    document.addEventListener(
        "click",
        function (evento) {

            const botao =
                evento.target.closest(
                    ".btn-view"
                );


            if (!botao) {
                return;
            }


            const id =
                Number(
                    botao.dataset.id
                );


            const documento =
                documentos.find(
                    item =>
                        item.id === id
                );


            if (!documento) {
                return;
            }


            preencherVisualizacao(
                documento
            );


            modal.classList.add(
                "active"
            );

        }
    );


    fecharModal.addEventListener(
        "click",
        fechar
    );


    fecharDocumento.addEventListener(
        "click",
        fechar
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (evento.target === modal) {
                fechar();
            }

        }
    );

}


// =====================================================
// PREENCHER VISUALIZAÇÃO
// =====================================================

function preencherVisualizacao(
    documento
) {

    document.getElementById(
        "ver-numero"
    ).textContent =
        documento.numero_entrada || "-";


    document.getElementById(
        "ver-tipo"
    ).textContent =
        documento.tipo || "-";


    document.getElementById(
        "ver-assunto"
    ).textContent =
        documento.assunto || "-";


    document.getElementById(
        "ver-remetente"
    ).textContent =
        documento.remetente || "-";


    document.getElementById(
        "ver-destinatario"
    ).textContent =
        documento.destinatario || "-";


    document.getElementById(
        "ver-data-documento"
    ).textContent =
        documento.data_documento || "-";


    document.getElementById(
        "ver-data-recepcao"
    ).textContent =
        documento.data_rececao || "-";


    document.getElementById(
        "ver-prioridade"
    ).textContent =
        documento.prioridade || "-";


    let estado =
        documento.estado || "-";


    if (estado === "em_analise") {

        estado = "Em análise";

    }

    else if (estado === "concluido") {

        estado = "Concluído";

    }

    else if (estado === "recebido") {

        estado = "Recebido";

    }


    document.getElementById(
        "ver-estado"
    ).textContent =
        estado;


    document.getElementById(
        "ver-departamento"
    ).textContent =
        documento.departamento_id || "-";


    document.getElementById(
        "ver-registado-por"
    ).textContent =
        documento.registado_por || "-";

}


// =====================================================
// EDITAR DOCUMENTO
// =====================================================

function configurarEdicaoDocumento() {

    const modal =
        document.getElementById(
            "modal-editar-documento"
        );


    const formulario =
        document.getElementById(
            "form-editar-documento"
        );


    const fechar =
        document.getElementById(
            "fechar-modal-editar"
        );


    const cancelar =
        document.getElementById(
            "cancelar-edicao"
        );


    const mensagem =
        document.getElementById(
            "mensagem-editar-documento"
        );


    const botaoGuardar =
        document.getElementById(
            "guardar-edicao"
        );


    if (!modal || !formulario) {
        return;
    }


    let documentoActual = null;


    document.addEventListener(
        "click",
        function (evento) {

            const botao =
                evento.target.closest(
                    ".btn-edit"
                );


            if (!botao) {
                return;
            }


            const id =
                Number(
                    botao.dataset.id
                );


            documentoActual =
                documentos.find(
                    item =>
                        item.id === id
                );


            if (!documentoActual) {
                return;
            }


            preencherFormularioEdicao(
                documentoActual
            );


            mensagem.className =
                "form-message";

            mensagem.textContent = "";


            modal.classList.add(
                "active"
            );

        }
    );


    formulario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            if (!documentoActual) {
                return;
            }


            botaoGuardar.disabled =
                true;

            botaoGuardar.textContent =
                "A actualizar...";


            mensagem.className =
                "form-message";

            mensagem.textContent = "";


            const dados =
                obterDadosEdicao();


            try {

                const resposta =
                    await fetch(
                        `/documentos/${documentoActual.id}`,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(dados)

                        }
                    );


                const resultado =
                    await resposta.json();


                if (resposta.status === 401) {

                    terminarSessao();

                    return;

                }


                if (!resposta.ok) {

                    throw new Error(
                        resultado.detail ||
                        "Não foi possível actualizar o documento."
                    );

                }


                mensagem.className =
                    "form-message success";


                mensagem.textContent =
                    "Documento actualizado com sucesso.";


                await carregarDocumentos();


                setTimeout(
                    function () {

                        modal.classList.remove(
                            "active"
                        );

                    },
                    800
                );

            }

            catch (erro) {

                console.error(erro);

                mensagem.className =
                    "form-message error";

                mensagem.textContent =
                    erro.message;

            }

            finally {

                botaoGuardar.disabled =
                    false;

                botaoGuardar.textContent =
                    "Guardar alterações";

            }

        }
    );


    fechar.addEventListener(
        "click",
        function () {

            modal.classList.remove(
                "active"
            );

        }
    );


    cancelar.addEventListener(
        "click",
        function () {

            modal.classList.remove(
                "active"
            );

        }
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (evento.target === modal) {

                modal.classList.remove(
                    "active"
                );

            }

        }
    );

}


// =====================================================
// PREENCHER FORMULÁRIO DE EDIÇÃO
// =====================================================

function preencherFormularioEdicao(
    documento
) {

    document.getElementById(
        "editar-numero_entrada"
    ).value =
        documento.numero_entrada || "";


    document.getElementById(
        "editar-tipo"
    ).value =
        documento.tipo || "";


    document.getElementById(
        "editar-assunto"
    ).value =
        documento.assunto || "";


    document.getElementById(
        "editar-remetente"
    ).value =
        documento.remetente || "";


    document.getElementById(
        "editar-destinatario"
    ).value =
        documento.destinatario || "";


    document.getElementById(
        "editar-data_documento"
    ).value =
        documento.data_documento || "";


    document.getElementById(
        "editar-data_rececao"
    ).value =
        documento.data_rececao || "";


    document.getElementById(
        "editar-prioridade"
    ).value =
        documento.prioridade || "normal";


    document.getElementById(
        "editar-estado"
    ).value =
        documento.estado || "recebido";


    document.getElementById(
        "editar-departamento_id"
    ).value =
        documento.departamento_id || "";

}


// =====================================================
// OBTER DADOS DA EDIÇÃO
// =====================================================

function obterDadosEdicao() {

    return {

        numero_entrada:
            document.getElementById(
                "editar-numero_entrada"
            ).value.trim(),

        tipo:
            document.getElementById(
                "editar-tipo"
            ).value.trim(),

        assunto:
            document.getElementById(
                "editar-assunto"
            ).value.trim(),

        remetente:
            document.getElementById(
                "editar-remetente"
            ).value.trim(),

        destinatario:
            document.getElementById(
                "editar-destinatario"
            ).value.trim() || null,

        data_documento:
            document.getElementById(
                "editar-data_documento"
            ).value || null,

        data_rececao:
            document.getElementById(
                "editar-data_rececao"
            ).value,

        prioridade:
            document.getElementById(
                "editar-prioridade"
            ).value,

        estado:
            document.getElementById(
                "editar-estado"
            ).value,

        departamento_id:
            document.getElementById(
                "editar-departamento_id"
            ).value
                ? Number(
                    document.getElementById(
                        "editar-departamento_id"
                    ).value
                )
                : null

    };

}


// =====================================================
// ELIMINAR DOCUMENTO
// =====================================================

function configurarEliminacaoDocumento() {

    document.addEventListener(
        "click",
        async function (evento) {

            const botao =
                evento.target.closest(
                    ".btn-delete"
                );


            if (!botao) {
                return;
            }


            const id =
                Number(
                    botao.dataset.id
                );


            const documento =
                documentos.find(
                    item =>
                        item.id === id
                );


            if (!documento) {
                return;
            }


            const confirmar =
                window.confirm(
                    `Tem a certeza que pretende eliminar o documento "${documento.numero_entrada}"?`
                );


            if (!confirmar) {
                return;
            }


            botao.disabled = true;


            try {

                const resposta =
                    await fetch(
                        `/documentos/${id}`,
                        {

                            method: "DELETE",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`

                            }

                        }
                    );


                const resultado =
                    await resposta.json();


                if (resposta.status === 401) {

                    terminarSessao();

                    return;

                }


                if (!resposta.ok) {

                    throw new Error(
                        resultado.detail ||
                        "Não foi possível eliminar o documento."
                    );

                }


                alert(
                    "Documento eliminado com sucesso."
                );


                await carregarDocumentos();

            }

            catch (erro) {

                console.error(erro);

                alert(
                    erro.message
                );

            }

            finally {

                botao.disabled =
                    false;

            }

        }
    );

}


// =====================================================
// TERMINAR SESSÃO
// =====================================================

function terminarSessao() {

    localStorage.removeItem(
        "sgd_token"
    );

    localStorage.removeItem(
        "sgd_utilizador"
    );

    window.location.href =
        "/login";

}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        carregarUtilizador();

        configurarPesquisa();

        configurarNovoDocumento();

        configurarVisualizacaoDocumento();

        configurarEdicaoDocumento();

        configurarEliminacaoDocumento();

        carregarDocumentos();

    }
);
function obterTokenAutenticacao() {
    return localStorage.getItem("sgd_token") || localStorage.getItem("access_token");
}

const token = obterTokenAutenticacao();

if (!token) {
    window.location.href = "/login";
}


async function carregarDashboard() {

    try {

        const resposta = await fetch("/dashboard/", {
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
                "Não foi possível carregar o Dashboard."
            );
        }


        const dados = await resposta.json();


        document.getElementById("total-documentos").textContent =
            dados.total_documentos;

        document.getElementById("documentos-recebidos").textContent =
            dados.documentos_recebidos;

        document.getElementById("total-tramitacoes").textContent =
            dados.total_tramitacoes;

        document.getElementById("tramitacoes-pendentes").textContent =
            dados.tramitacoes_pendentes;

        document.getElementById("total-anexos").textContent =
            dados.total_anexos;

        document.getElementById("documentos-concluidos").textContent =
            dados.documentos_concluidos;


        const lista = document.getElementById("activity-list");

        lista.innerHTML = "";


        if (
            !dados.historico_recente ||
            dados.historico_recente.length === 0
        ) {

            lista.innerHTML = `
                <div class="loading">
                    Ainda não existem actividades registadas.
                </div>
            `;

            return;
        }


        dados.historico_recente.forEach(item => {

            const data = new Date(item.data_accao);

            const dataFormatada =
                data.toLocaleString("pt-PT");


            const elemento =
                document.createElement("div");

            elemento.className = "activity-item";


            elemento.innerHTML = `
                <div class="activity-icon">
                    ✓
                </div>

                <div class="activity-info">

                    <div class="activity-action">
                        ${item.accao}
                    </div>

                    <div class="activity-description">
                        ${item.descricao || ""}
                    </div>

                </div>

                <div class="activity-date">
                    ${dataFormatada}
                </div>
            `;


            lista.appendChild(elemento);

        });

    }

    catch (erro) {

        console.error(erro);

        document.getElementById(
            "activity-list"
        ).innerHTML = `
            <div class="loading">
                Não foi possível carregar os dados
                do Dashboard.
            </div>
        `;
    }
}


function carregarUtilizador() {

    const dados =
        localStorage.getItem("sgd_utilizador");

    if (!dados) {
        return;
    }


    const utilizador = JSON.parse(dados);


    const nome =
        document.querySelector(".user-area strong");

    const perfil =
        document.querySelector(".user-area small");

    const avatar =
        document.querySelector(".user-avatar");


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


document.addEventListener(
    "DOMContentLoaded",
    function () {

        carregarUtilizador();
        carregarDashboard();

    }
);
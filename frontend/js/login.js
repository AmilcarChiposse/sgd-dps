const formulario = document.getElementById("login-form");

const campoUsername = document.getElementById("username");
const campoSenha = document.getElementById("senha");

const mensagemErro = document.getElementById("login-error");
const botaoLogin = document.getElementById("login-button");


formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    mensagemErro.style.display = "none";
    mensagemErro.textContent = "";

    botaoLogin.disabled = true;
    botaoLogin.textContent = "A entrar...";


    const username = campoUsername.value.trim();
    const senha = campoSenha.value;


    try {

        const resposta = await fetch("/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                senha: senha
            })

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.detail || "Username ou senha incorrectos."
            );

        }


        localStorage.setItem(
            "sgd_token",
            dados.access_token
        );


        localStorage.setItem(
            "sgd_utilizador",
            JSON.stringify({
                id: dados.utilizador_id,
                username: dados.username,
                nome_completo: dados.nome_completo,
                perfil: dados.perfil
            })
        );


        window.location.href = "/app";

    }

    catch (erro) {

        mensagemErro.textContent = erro.message;
        mensagemErro.style.display = "block";

    }

    finally {

        botaoLogin.disabled = false;
        botaoLogin.textContent = "Entrar";

    }

});
from fastapi import Depends, FastAPI
from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.routers.departamentos import router as departamentos_router
from backend.app.routers.utilizadores import router as utilizadores_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.documentos import router as documentos_router
from backend.app.routers.tramitacoes import router as tramitacoes_router
from backend.app.routers.anexos import router as anexos_router
from backend.app.routers.historicos import router as historicos_router
from backend.app.routers.dashboard import router as dashboard_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI(
    title="SGD-DPS",
    description="Sistema de Gestão Documental da Direcção Provincial de Saúde",
    version="0.1.0",
)

app.mount(
    "/frontend",
    StaticFiles(directory="frontend"),
    name="frontend",
)

@app.get("/app")
def pagina_inicial():
    return FileResponse("frontend/index.html")

@app.get("/login")
def pagina_login():
    return FileResponse("frontend/login.html")

@app.get("/documentos")
def pagina_documentos():
    return FileResponse("frontend/documentos.html")

@app.get("/")
def root():
    return {
        "sistema": "SGD-DPS",
        "descricao": "Sistema de Gestão Documental da Direcção Provincial de Saúde",
        "versao": "0.1.0",
        "estado": "Em desenvolvimento",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "sistema": "SGD-DPS",
    }


@app.get("/auth/me")
def utilizador_actual(
    utilizador: dict = Depends(obter_utilizador_actual),
):
    return {
        "mensagem": "Utilizador autenticado.",
        "utilizador": utilizador,
    }

@app.get("/tramitacoes")
def pagina_tramitacoes():
    return FileResponse("frontend/tramitacoes.html")

app.include_router(departamentos_router)
app.include_router(utilizadores_router)
app.include_router(auth_router)
app.include_router(documentos_router)
app.include_router(tramitacoes_router)
app.include_router(anexos_router)
app.include_router(historicos_router)
app.include_router(dashboard_router)
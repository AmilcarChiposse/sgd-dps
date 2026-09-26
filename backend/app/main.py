from fastapi import FastAPI

app = FastAPI(
    title="SGD-DPS",
    description="Sistema de Gestao Documental da Direccao Provincial de Saude",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "sistema": "SGD-DPS",
        "descricao": "Sistema de Gestao Documental da Direccao Provincial de Saude",
        "versao": "0.1.0",
        "estado": "Em desenvolvimento",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "sistema": "SGD-DPS",
    }
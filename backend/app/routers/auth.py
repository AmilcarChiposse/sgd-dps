from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.jwt import criar_access_token
from backend.app.core.security import verificar_senha
from backend.app.database.database import get_db
from backend.app.database.models.utilizador import Utilizador
from backend.app.schemas.auth import LoginRequest, LoginResponse


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db),
):
    utilizador = (
        db.query(Utilizador)
        .filter(Utilizador.username == dados.username)
        .first()
    )

    if utilizador is None:
        raise HTTPException(
            status_code=401,
            detail="Username ou senha incorrectos.",
        )

    if not utilizador.activo:
        raise HTTPException(
            status_code=403,
            detail="Este utilizador está desactivado.",
        )

    if not verificar_senha(dados.senha, utilizador.senha_hash):
        raise HTTPException(
            status_code=401,
            detail="Username ou senha incorrectos.",
        )

    access_token = criar_access_token(
        utilizador_id=utilizador.id,
        username=utilizador.username,
        perfil=utilizador.perfil,
    )

    return {
        "mensagem": "Login efectuado com sucesso.",
        "access_token": access_token,
        "token_type": "bearer",
        "utilizador_id": utilizador.id,
        "username": utilizador.username,
        "nome_completo": utilizador.nome_completo,
        "perfil": utilizador.perfil,
    }
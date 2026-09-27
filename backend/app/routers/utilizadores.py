from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.security import criar_hash_senha
from backend.app.database.database import get_db
from backend.app.database.models.utilizador import Utilizador
from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.core.dependencies import exigir_perfil

from backend.app.schemas.utilizador import (
    UtilizadorCreate,
    UtilizadorResponse,
    UtilizadorUpdate,
)

router = APIRouter(
    prefix="/utilizadores",
    tags=["Utilizadores"],
    dependencies=[Depends(obter_utilizador_actual)],
)


@router.get("/", response_model=list[UtilizadorResponse])
def listar_utilizadores(db: Session = Depends(get_db)):
    return db.query(Utilizador).order_by(Utilizador.nome_completo).all()

@router.post(
    "/",
    response_model=UtilizadorResponse,
    status_code=201,
)
def criar_utilizador(
    dados: UtilizadorCreate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(exigir_perfil("administrador")),
):
    existente = (
        db.query(Utilizador)
        .filter(Utilizador.username == dados.username)
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um utilizador com este username.",
        )

    if dados.email:
        email_existente = (
            db.query(Utilizador)
            .filter(Utilizador.email == dados.email)
            .first()
        )

        if email_existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe um utilizador com este email.",
            )

    senha_hash = criar_hash_senha(dados.senha)

    utilizador = Utilizador(
        nome_completo=dados.nome_completo,
        username=dados.username,
        email=dados.email,
        senha_hash=senha_hash,
        perfil=dados.perfil,
        activo=dados.activo,
        departamento_id=dados.departamento_id,
    )

    db.add(utilizador)
    db.commit()
    db.refresh(utilizador)

    return utilizador

@router.get(
    "/{utilizador_id}",
    response_model=UtilizadorResponse,
)
def obter_utilizador(
    utilizador_id: int,
    db: Session = Depends(get_db),
):
    utilizador = (
        db.query(Utilizador)
        .filter(Utilizador.id == utilizador_id)
        .first()
    )

    if utilizador is None:
        raise HTTPException(
            status_code=404,
            detail="Utilizador não encontrado.",
        )

    return utilizador

@router.put(
    "/{utilizador_id}",
    response_model=UtilizadorResponse,
)
def actualizar_utilizador(
    utilizador_id: int,
    dados: UtilizadorUpdate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(exigir_perfil("administrador")),
):
    utilizador = (
        db.query(Utilizador)
        .filter(Utilizador.id == utilizador_id)
        .first()
    )

    if utilizador is None:
        raise HTTPException(
            status_code=404,
            detail="Utilizador não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    if "username" in alteracoes:
        outro = (
            db.query(Utilizador)
            .filter(
                Utilizador.username == alteracoes["username"],
                Utilizador.id != utilizador_id,
            )
            .first()
        )

        if outro:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro utilizador com este username.",
            )

    if "email" in alteracoes and alteracoes["email"]:
        outro_email = (
            db.query(Utilizador)
            .filter(
                Utilizador.email == alteracoes["email"],
                Utilizador.id != utilizador_id,
            )
            .first()
        )

        if outro_email:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro utilizador com este email.",
            )

    if "senha" in alteracoes:
        alteracoes["senha_hash"] = criar_hash_senha(alteracoes.pop("senha"))

    for campo, valor in alteracoes.items():
        setattr(utilizador, campo, valor)

    db.commit()
    db.refresh(utilizador)

    return utilizador

@router.delete(
    "/{utilizador_id}",
    response_model=UtilizadorResponse,
)
def desactivar_utilizador(
    utilizador_id: int,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(exigir_perfil("administrador")),
):
    utilizador = (
        db.query(Utilizador)
        .filter(Utilizador.id == utilizador_id)
        .first()
    )

    if utilizador is None:
        raise HTTPException(
            status_code=404,
            detail="Utilizador não encontrado.",
        )

    utilizador.activo = False

    db.commit()
    db.refresh(utilizador)

    return utilizador
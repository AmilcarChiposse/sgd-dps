from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.database.database import get_db
from backend.app.database.models.tramitacao import Tramitacao
from backend.app.schemas.tramitacao import (
    TramitacaoCreate,
    TramitacaoResponse,
    TramitacaoUpdate,
)


router = APIRouter(
    prefix="/tramitacoes",
    tags=["Tramitações"],
    dependencies=[Depends(obter_utilizador_actual)],
)


@router.get(
    "/",
    response_model=list[TramitacaoResponse],
)
def listar_tramitacoes(
    db: Session = Depends(get_db),
):
    return (
        db.query(Tramitacao)
        .order_by(Tramitacao.id.desc())
        .all()
    )


@router.get(
    "/{tramitacao_id}",
    response_model=TramitacaoResponse,
)
def obter_tramitacao(
    tramitacao_id: int,
    db: Session = Depends(get_db),
):
    tramitacao = (
        db.query(Tramitacao)
        .filter(Tramitacao.id == tramitacao_id)
        .first()
    )

    if tramitacao is None:
        raise HTTPException(
            status_code=404,
            detail="Tramitação não encontrada.",
        )

    return tramitacao


@router.post(
    "/",
    response_model=TramitacaoResponse,
    status_code=201,
)
def criar_tramitacao(
    dados: TramitacaoCreate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    tramitacao = Tramitacao(
        documento_id=dados.documento_id,
        origem_departamento_id=dados.origem_departamento_id,
        destino_departamento_id=dados.destino_departamento_id,
        estado=dados.estado,
        observacao=dados.observacao,
        encaminhado_por=int(utilizador_actual["sub"]),
    )

    db.add(tramitacao)
    db.commit()
    db.refresh(tramitacao)

    return tramitacao


@router.put(
    "/{tramitacao_id}",
    response_model=TramitacaoResponse,
)
def actualizar_tramitacao(
    tramitacao_id: int,
    dados: TramitacaoUpdate,
    db: Session = Depends(get_db),
):
    tramitacao = (
        db.query(Tramitacao)
        .filter(Tramitacao.id == tramitacao_id)
        .first()
    )

    if tramitacao is None:
        raise HTTPException(
            status_code=404,
            detail="Tramitação não encontrada.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    for campo, valor in alteracoes.items():
        setattr(tramitacao, campo, valor)

    db.commit()
    db.refresh(tramitacao)

    return tramitacao


@router.delete(
    "/{tramitacao_id}",
    response_model=TramitacaoResponse,
)
def eliminar_tramitacao(
    tramitacao_id: int,
    db: Session = Depends(get_db),
):
    tramitacao = (
        db.query(Tramitacao)
        .filter(Tramitacao.id == tramitacao_id)
        .first()
    )

    if tramitacao is None:
        raise HTTPException(
            status_code=404,
            detail="Tramitação não encontrada.",
        )

    db.delete(tramitacao)
    db.commit()

    return tramitacao
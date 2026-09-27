from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.database.database import get_db
from backend.app.database.models.historico import Historico
from backend.app.schemas.historico import HistoricoResponse


router = APIRouter(
    prefix="/historicos",
    tags=["Histórico"],
    dependencies=[Depends(obter_utilizador_actual)],
)


@router.get(
    "/",
    response_model=list[HistoricoResponse],
)
def listar_historicos(
    db: Session = Depends(get_db),
):
    return (
        db.query(Historico)
        .order_by(Historico.id.desc())
        .all()
    )


@router.get(
    "/documento/{documento_id}",
    response_model=list[HistoricoResponse],
)
def listar_historico_documento(
    documento_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Historico)
        .filter(Historico.documento_id == documento_id)
        .order_by(Historico.id.desc())
        .all()
    )


@router.get(
    "/{historico_id}",
    response_model=HistoricoResponse,
)
def obter_historico(
    historico_id: int,
    db: Session = Depends(get_db),
):
    historico = (
        db.query(Historico)
        .filter(Historico.id == historico_id)
        .first()
    )

    if historico is None:
        raise HTTPException(
            status_code=404,
            detail="Registo de histórico não encontrado.",
        )

    return historico
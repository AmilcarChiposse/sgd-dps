from sqlalchemy.orm import Session

from backend.app.database.models.historico import Historico


def registar_historico(
    db: Session,
    accao: str,
    descricao: str | None = None,
    utilizador_id: int | None = None,
    documento_id: int | None = None,
):
    historico = Historico(
        utilizador_id=utilizador_id,
        documento_id=documento_id,
        accao=accao,
        descricao=descricao,
    )

    db.add(historico)

    return historico
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.database.database import get_db
from backend.app.database.models.anexo import Anexo
from backend.app.database.models.documento import Documento
from backend.app.database.models.tramitacao import Tramitacao
from backend.app.database.models.historico import Historico

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(obter_utilizador_actual)],
)


@router.get("/")
def obter_dashboard(
    db: Session = Depends(get_db),
):
    total_documentos = (
        db.query(Documento)
        .count()
    )

    documentos_recebidos = (
        db.query(Documento)
        .filter(Documento.estado == "recebido")
        .count()
    )

    documentos_em_analise = (
        db.query(Documento)
        .filter(Documento.estado == "em_analise")
        .count()
    )

    documentos_concluidos = (
        db.query(Documento)
        .filter(Documento.estado == "concluido")
        .count()
    )

    documentos_prioritarios = (
        db.query(Documento)
        .filter(Documento.prioridade == "alta")
        .count()
    )

    total_tramitacoes = (
        db.query(Tramitacao)
        .count()
    )

    tramitacoes_pendentes = (
        db.query(Tramitacao)
        .filter(Tramitacao.estado == "pendente")
        .count()
    )

    total_anexos = (
        db.query(Anexo)
        .count()
    )

    historico_recente = (
    db.query(Historico)
    .order_by(Historico.id.desc())
    .limit(10)
    .all()
   )

    return {
    "total_documentos": total_documentos,
    "documentos_recebidos": documentos_recebidos,
    "documentos_em_analise": documentos_em_analise,
    "documentos_concluidos": documentos_concluidos,
    "documentos_prioritarios": documentos_prioritarios,
    "total_tramitacoes": total_tramitacoes,
    "tramitacoes_pendentes": tramitacoes_pendentes,
    "total_anexos": total_anexos,
    "historico_recente": [
        {
            "id": item.id,
            "utilizador_id": item.utilizador_id,
            "documento_id": item.documento_id,
            "accao": item.accao,
            "descricao": item.descricao,
            "data_accao": item.data_accao,
        }
        for item in historico_recente
    ],
}
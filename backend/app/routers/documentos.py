import os
from backend.app.database.models.anexo import Anexo
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.services.historico import registar_historico
from backend.app.database.database import get_db
from backend.app.database.models.documento import Documento
from backend.app.database.models.tramitacao import Tramitacao
from backend.app.database.models.historico import Historico

from backend.app.core.dependencies import (
    obter_utilizador_actual,
    exigir_perfil,
)

from backend.app.schemas.documento import (
    DocumentoCreate,
    DocumentoResponse,
    DocumentoUpdate,
)


router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"],
    dependencies=[Depends(obter_utilizador_actual)],
)


@router.get("/", response_model=list[DocumentoResponse])
def listar_documentos(
    db: Session = Depends(get_db),
):
    return (
        db.query(Documento)
        .order_by(Documento.id.desc())
        .all()
    )


@router.get(
    "/{documento_id}",
    response_model=DocumentoResponse,
)
def obter_documento(
    documento_id: int,
    db: Session = Depends(get_db),
):
    documento = (
        db.query(Documento)
        .filter(Documento.id == documento_id)
        .first()
    )

    if documento is None:
        raise HTTPException(
            status_code=404,
            detail="Documento não encontrado.",
        )

    return documento


@router.post(
    "/",
    response_model=DocumentoResponse,
    status_code=201,
)
def criar_documento(
    dados: DocumentoCreate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(
    exigir_perfil("admin", "administrador", "tecnico")
),
):
    existente = (
        db.query(Documento)
        .filter(
            Documento.numero_entrada == dados.numero_entrada
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um documento com este número de entrada.",
        )

    documento = Documento(
        numero_entrada=dados.numero_entrada,
        tipo=dados.tipo,
        assunto=dados.assunto,
        remetente=dados.remetente,
        destinatario=dados.destinatario,
        data_documento=dados.data_documento,
        data_rececao=dados.data_rececao,
        prioridade=dados.prioridade,
        estado=dados.estado,
        departamento_id=dados.departamento_id,
        registado_por=int(utilizador_actual["sub"]),
    )

    db.add(documento)
    db.commit()
    db.refresh(documento)

    return documento


@router.put(
    "/{documento_id}",
    response_model=DocumentoResponse,
)
def actualizar_documento(
    documento_id: int,
    dados: DocumentoUpdate,
    db: Session = Depends(get_db),
):
    documento = (
        db.query(Documento)
        .filter(Documento.id == documento_id)
        .first()
    )

    if documento is None:
        raise HTTPException(
            status_code=404,
            detail="Documento não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    if (
        "numero_entrada" in alteracoes
        and alteracoes["numero_entrada"]
    ):
        outro = (
            db.query(Documento)
            .filter(
                Documento.numero_entrada
                == alteracoes["numero_entrada"],
                Documento.id != documento_id,
            )
            .first()
        )

        if outro:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro documento com este número de entrada.",
            )

    for campo, valor in alteracoes.items():
        setattr(documento, campo, valor)

    db.commit()
    db.refresh(documento)

    return documento


@router.delete(
    "/{documento_id}",
    response_model=DocumentoResponse,
)
def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
):
    documento = (
        db.query(Documento)
        .filter(Documento.id == documento_id)
        .first()
    )

    if documento is None:
        raise HTTPException(
            status_code=404,
            detail="Documento não encontrado.",
        )

    # Guardar os caminhos dos ficheiros antes de eliminar os anexos
    anexos = (
        db.query(Anexo)
        .filter(Anexo.documento_id == documento_id)
        .all()
    )

    caminhos_anexos = [anexo.caminho for anexo in anexos]

    # Eliminar os anexos da base de dados
    for anexo in anexos:
        db.delete(anexo)

    # Eliminar tramitações associadas ao documento
    db.query(Tramitacao).filter(
        Tramitacao.documento_id == documento_id
    ).delete(
        synchronize_session=False
    )

    # Preservar o histórico, retirando a referência ao documento
    db.query(Historico).filter(
        Historico.documento_id == documento_id
    ).update(
        {"documento_id": None},
        synchronize_session=False,
    )

    # Eliminar o documento
    db.delete(documento)
    db.commit()

    # Eliminar os ficheiros físicos dos anexos
    for caminho in caminhos_anexos:
        if caminho and os.path.exists(caminho):
            os.remove(caminho)

    return documento
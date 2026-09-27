import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.app.core.dependencies import obter_utilizador_actual
from backend.app.database.database import get_db
from backend.app.database.models.anexo import Anexo
from backend.app.database.models.documento import Documento
from backend.app.schemas.anexo import AnexoResponse


router = APIRouter(
    prefix="/anexos",
    tags=["Anexos"],
    dependencies=[Depends(obter_utilizador_actual)],
)


PASTA_UPLOADS = "uploads"


@router.post(
    "/upload/{documento_id}",
    response_model=AnexoResponse,
    status_code=201,
)
def carregar_anexo(
    documento_id: int,
    ficheiro: UploadFile = File(...),
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

    os.makedirs(PASTA_UPLOADS, exist_ok=True)

    extensao = os.path.splitext(ficheiro.filename or "")[1]
    nome_armazenado = f"{uuid.uuid4().hex}{extensao}"
    caminho = os.path.join(PASTA_UPLOADS, nome_armazenado)

    conteudo = ficheiro.file.read()

    with open(caminho, "wb") as arquivo:
        arquivo.write(conteudo)

    anexo = Anexo(
        documento_id=documento_id,
        nome_original=ficheiro.filename or "ficheiro",
        nome_armazenado=nome_armazenado,
        caminho=caminho,
        tipo_ficheiro=ficheiro.content_type,
        tamanho_bytes=len(conteudo),
    )

    db.add(anexo)
    db.commit()
    db.refresh(anexo)

    return anexo


@router.get(
    "/documento/{documento_id}",
    response_model=list[AnexoResponse],
)
def listar_anexos_documento(
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

    return (
        db.query(Anexo)
        .filter(Anexo.documento_id == documento_id)
        .order_by(Anexo.id.desc())
        .all()
    )


@router.get(
    "/{anexo_id}",
    response_model=AnexoResponse,
)
def obter_anexo(
    anexo_id: int,
    db: Session = Depends(get_db),
):
    anexo = (
        db.query(Anexo)
        .filter(Anexo.id == anexo_id)
        .first()
    )

    if anexo is None:
        raise HTTPException(
            status_code=404,
            detail="Anexo não encontrado.",
        )

    return anexo


@router.delete(
    "/{anexo_id}",
    response_model=AnexoResponse,
)
def eliminar_anexo(
    anexo_id: int,
    db: Session = Depends(get_db),
):
    anexo = (
        db.query(Anexo)
        .filter(Anexo.id == anexo_id)
        .first()
    )

    if anexo is None:
        raise HTTPException(
            status_code=404,
            detail="Anexo não encontrado.",
        )

    caminho = anexo.caminho

    db.delete(anexo)
    db.commit()

    if os.path.exists(caminho):
        os.remove(caminho)

    return anexo
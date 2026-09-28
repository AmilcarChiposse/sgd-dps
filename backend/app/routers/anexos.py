import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.models.anexo import Anexo
from backend.app.database.models.documento import Documento
from backend.app.schemas.anexo import AnexoResponse
from backend.app.services.historico import registar_historico

from backend.app.core.dependencies import (
    obter_utilizador_actual,
    exigir_perfil,
)

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
    utilizador_actual: dict = Depends(
    exigir_perfil("admin", "tecnico")
),
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
    db.flush()

    registar_historico(
        db=db,
        accao="Anexo carregado",
        descricao=(
            f"O ficheiro {anexo.nome_original} foi anexado "
            f"ao documento {documento.numero_entrada}."
        ),
        utilizador_id=int(utilizador_actual["sub"]),
        documento_id=documento_id,
    )

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
    "/download/{anexo_id}",
)
def descarregar_anexo(
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

    if not os.path.exists(anexo.caminho):
        raise HTTPException(
            status_code=404,
            detail="Ficheiro não encontrado no armazenamento.",
        )

    return FileResponse(
        path=anexo.caminho,
        filename=anexo.nome_original,
        media_type=anexo.tipo_ficheiro or "application/octet-stream",
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
    utilizador_actual: dict = Depends(
        exigir_perfil("admin")
    ),
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
    nome_original = anexo.nome_original
    documento_id = anexo.documento_id

    db.delete(anexo)

    registar_historico(
        db=db,
        accao="Anexo eliminado",
        descricao=(
            f"O ficheiro {nome_original} foi eliminado "
            f"do documento ID {documento_id}."
        ),
        utilizador_id=int(utilizador_actual["sub"]),
        documento_id=documento_id,
    )

    db.commit()

    if os.path.exists(caminho):
        os.remove(caminho)

    return anexo
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.models.departamento import Departamento
from backend.app.schemas.departamento import (
    DepartamentoCreate,
    DepartamentoResponse,
    DepartamentoUpdate,
)
from backend.app.core.dependencies import obter_utilizador_actual


router = APIRouter(
    prefix="/departamentos",
    tags=["Departamentos"],
     dependencies=[Depends(obter_utilizador_actual)],
)


@router.get("/", response_model=list[DepartamentoResponse])
def listar_departamentos(
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    return db.query(Departamento).order_by(Departamento.nome).all()


@router.get("/{departamento_id}", response_model=DepartamentoResponse)
def obter_departamento(
    departamento_id: int,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if departamento is None:
        raise HTTPException(
            status_code=404,
            detail="Departamento não encontrado.",
        )

    return departamento


@router.post(
    "/",
    response_model=DepartamentoResponse,
    status_code=201,
)
def criar_departamento(
    dados: DepartamentoCreate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    existente = (
        db.query(Departamento)
        .filter(Departamento.nome == dados.nome)
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um departamento com este nome.",
        )

    departamento = Departamento(
        nome=dados.nome,
        descricao=dados.descricao,
        activo=dados.activo,
    )

    db.add(departamento)
    db.commit()
    db.refresh(departamento)

    return departamento


@router.put(
    "/{departamento_id}",
    response_model=DepartamentoResponse,
)
def actualizar_departamento(
    departamento_id: int,
    dados: DepartamentoUpdate,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if departamento is None:
        raise HTTPException(
            status_code=404,
            detail="Departamento não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    if "nome" in alteracoes:
        outro = (
            db.query(Departamento)
            .filter(
                Departamento.nome == alteracoes["nome"],
                Departamento.id != departamento_id,
            )
            .first()
        )

        if outro:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro departamento com este nome.",
            )

    for campo, valor in alteracoes.items():
        setattr(departamento, campo, valor)

    db.commit()
    db.refresh(departamento)

    return departamento


@router.delete(
    "/{departamento_id}",
    response_model=DepartamentoResponse,
)
def desactivar_departamento(
    departamento_id: int,
    db: Session = Depends(get_db),
    utilizador_actual: dict = Depends(obter_utilizador_actual),
):
    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if departamento is None:
        raise HTTPException(
            status_code=404,
            detail="Departamento não encontrado.",
        )

    departamento.activo = False

    db.commit()
    db.refresh(departamento)

    return departamento
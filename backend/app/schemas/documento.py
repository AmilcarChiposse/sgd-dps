from datetime import date

from pydantic import BaseModel, ConfigDict


class DocumentoBase(BaseModel):
    numero_entrada: str
    tipo: str
    assunto: str
    remetente: str
    destinatario: str | None = None
    data_documento: date | None = None
    data_rececao: date
    prioridade: str = "normal"
    estado: str = "recebido"
    departamento_id: int | None = None


class DocumentoCreate(DocumentoBase):
    pass


class DocumentoUpdate(BaseModel):
    numero_entrada: str | None = None
    tipo: str | None = None
    assunto: str | None = None
    remetente: str | None = None
    destinatario: str | None = None
    data_documento: date | None = None
    data_rececao: date | None = None
    prioridade: str | None = None
    estado: str | None = None
    departamento_id: int | None = None


class DocumentoResponse(DocumentoBase):
    id: int
    registado_por: int | None = None

    model_config = ConfigDict(from_attributes=True)
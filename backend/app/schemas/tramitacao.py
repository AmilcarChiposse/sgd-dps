from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TramitacaoBase(BaseModel):
    documento_id: int
    origem_departamento_id: int | None = None
    destino_departamento_id: int | None = None
    estado: str = "pendente"
    observacao: str | None = None


class TramitacaoCreate(TramitacaoBase):
    pass


class TramitacaoUpdate(BaseModel):
    origem_departamento_id: int | None = None
    destino_departamento_id: int | None = None
    estado: str | None = None
    observacao: str | None = None


class TramitacaoResponse(TramitacaoBase):
    id: int
    encaminhado_por: int | None = None
    data_encaminhamento: datetime

    model_config = ConfigDict(from_attributes=True)
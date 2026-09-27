from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HistoricoResponse(BaseModel):
    id: int
    utilizador_id: int | None = None
    documento_id: int | None = None
    accao: str
    descricao: str | None = None
    data_accao: datetime

    model_config = ConfigDict(from_attributes=True)
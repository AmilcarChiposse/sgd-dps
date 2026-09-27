from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnexoResponse(BaseModel):
    id: int
    documento_id: int
    nome_original: str
    nome_armazenado: str
    caminho: str
    tipo_ficheiro: str | None = None
    tamanho_bytes: int | None = None
    data_upload: datetime

    model_config = ConfigDict(from_attributes=True)
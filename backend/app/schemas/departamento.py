from pydantic import BaseModel, ConfigDict


class DepartamentoBase(BaseModel):
    nome: str
    descricao: str | None = None
    activo: bool = True


class DepartamentoCreate(DepartamentoBase):
    pass


class DepartamentoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    activo: bool | None = None


class DepartamentoResponse(DepartamentoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

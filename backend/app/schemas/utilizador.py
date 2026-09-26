from pydantic import BaseModel, ConfigDict, EmailStr


class UtilizadorBase(BaseModel):
    nome_completo: str
    username: str
    email: EmailStr | None = None
    perfil: str
    activo: bool = True
    departamento_id: int | None = None


class UtilizadorCreate(UtilizadorBase):
    senha: str


class UtilizadorUpdate(BaseModel):
    nome_completo: str | None = None
    username: str | None = None
    email: EmailStr | None = None
    perfil: str | None = None
    activo: bool | None = None
    departamento_id: int | None = None
    senha: str | None = None


class UtilizadorResponse(UtilizadorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
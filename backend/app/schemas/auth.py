from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    senha: str


class LoginResponse(BaseModel):
    mensagem: str
    access_token: str
    token_type: str
    utilizador_id: int
    username: str
    nome_completo: str
    perfil: str
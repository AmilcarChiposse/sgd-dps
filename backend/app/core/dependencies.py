from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.jwt import verificar_access_token


security = HTTPBearer()


def obter_utilizador_actual(
    credenciais: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credenciais.credentials

    try:
        payload = verificar_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado.",
        )

    return payload
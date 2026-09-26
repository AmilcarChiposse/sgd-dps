from datetime import datetime, timedelta, timezone

import jwt

from backend.app.core.config import settings


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def criar_access_token(
    utilizador_id: int,
    username: str,
    perfil: str,
) -> str:
    agora = datetime.now(timezone.utc)

    payload = {
        "sub": str(utilizador_id),
        "username": username,
        "perfil": perfil,
        "iat": agora,
        "exp": agora + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=ALGORITHM,
    )


def verificar_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[ALGORITHM],
    )
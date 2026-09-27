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
    except Exception as erro:
        print(f"ERRO JWT: {type(erro).__name__}: {erro}")
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado.",
        )

    return payload

def exigir_perfil(*perfis_permitidos: str):
    def dependencia(
        utilizador_actual: dict = Depends(obter_utilizador_actual),
    ) -> dict:

        perfil = utilizador_actual.get("perfil")

        if perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=403,
                detail="Não tem permissão para realizar esta operação.",
            )

        return utilizador_actual

    return dependencia
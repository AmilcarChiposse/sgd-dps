from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class Anexo(Base):
    __tablename__ = "anexos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    documento_id: Mapped[int] = mapped_column(
        ForeignKey("documentos.id"),
        nullable=False,
    )

    nome_original: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    nome_armazenado: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    caminho: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    tipo_ficheiro: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    tamanho_bytes: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    data_upload: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

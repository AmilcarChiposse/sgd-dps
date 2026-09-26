from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class Arquivo(Base):
    __tablename__ = "arquivos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    documento_id: Mapped[int] = mapped_column(
        ForeignKey("documentos.id"),
        nullable=False,
    )

    localizacao_fisica: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    localizacao_digital: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    classificacao: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    data_arquivamento: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    observacao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

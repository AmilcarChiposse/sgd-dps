from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class Historico(Base):
    __tablename__ = "historicos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    utilizador_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilizadores.id"),
        nullable=True,
    )

    documento_id: Mapped[int | None] = mapped_column(
        ForeignKey("documentos.id"),
        nullable=True,
    )

    accao: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    descricao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    data_accao: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class Tramitacao(Base):
    __tablename__ = "tramitacoes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    documento_id: Mapped[int] = mapped_column(
        ForeignKey("documentos.id"),
        nullable=False,
    )

    origem_departamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("departamentos.id"),
        nullable=True,
    )

    destino_departamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("departamentos.id"),
        nullable=True,
    )

    encaminhado_por: Mapped[int | None] = mapped_column(
        ForeignKey("utilizadores.id"),
        nullable=True,
    )

    data_encaminhamento: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        String(50),
        default="pendente",
        nullable=False,
    )

    observacao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

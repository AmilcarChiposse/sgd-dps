from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    numero_entrada: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    assunto: Mapped[str] = mapped_column(String(500), nullable=False)
    remetente: Mapped[str] = mapped_column(String(200), nullable=False)
    destinatario: Mapped[str | None] = mapped_column(String(200), nullable=True)
    data_documento: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_rececao: Mapped[date] = mapped_column(Date, nullable=False)
    prioridade: Mapped[str] = mapped_column(String(30), default="normal", nullable=False)
    estado: Mapped[str] = mapped_column(String(50), default="recebido", nullable=False)
    departamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("departamentos.id"),
        nullable=True,
    )
    registado_por: Mapped[int | None] = mapped_column(
        ForeignKey("utilizadores.id"),
        nullable=True,
    )

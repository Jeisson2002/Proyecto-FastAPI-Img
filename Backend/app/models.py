from sqlalchemy import Column, Integer, String, Float
from app.database import Base  # Ajusta si tu estructura es distinta

# ================================
#  Tabla de usuarios
# ================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


# ================================
#  Tabla para almacenar datos del Excel
# ================================
class ExcelData(Base):
    __tablename__ = "excel_data"

    id = Column(Integer, primary_key=True, index=True)

    # Ajusta según columnas reales del Excel
    columna_1 = Column(String(255), index=True)
    columna_2 = Column(Float)
    columna_3 = Column(String(255))

    def __repr__(self):
        return f"<ExcelData id={self.id}>"

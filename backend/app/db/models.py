from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean,
    JSON, ForeignKey, Text, Index, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Race(Base):
    __tablename__ = "races"
    __table_args__ = (
        Index("idx_races_season_round", "season", "round"),
    )
    id         = Column(Integer, primary_key=True)
    season     = Column(Integer, nullable=False)
    round      = Column(Integer, nullable=False)
    name       = Column(String(100), nullable=False)
    circuit    = Column(String(100), nullable=False)
    country    = Column(String(60))
    date       = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    sessions   = relationship("Session", back_populates="race", lazy="select")


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        Index("idx_sessions_race_type_imported", "race_id", "session_type", "imported"),
    )
    id           = Column(Integer, primary_key=True)
    race_id      = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    session_type = Column(String(20), nullable=False)
    date         = Column(DateTime)
    imported     = Column(Boolean, default=False, index=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    race         = relationship("Race", back_populates="sessions")
    laps         = relationship("Lap", back_populates="session", lazy="dynamic")


class Driver(Base):
    __tablename__ = "drivers"
    __table_args__ = (
        Index("idx_drivers_code_season", "code", "season"),
    )
    id          = Column(Integer, primary_key=True)
    code        = Column(String(4), nullable=False, index=True)
    season      = Column(Integer, nullable=False, default=2025)
    number      = Column(Integer)
    first_name  = Column(String(50))
    last_name   = Column(String(50))
    team        = Column(String(60))
    team_color  = Column(String(7))
    nationality = Column(String(40))
    created_at  = Column(DateTime, default=datetime.utcnow)


class Lap(Base):
    __tablename__ = "laps"
    __table_args__ = (
        Index("idx_laps_session_driver_lap", "session_id", "driver_code", "lap_number"),
        Index("idx_laps_session_driver_time", "session_id", "driver_code", "lap_time_ms"),
        UniqueConstraint("session_id", "driver_code", "lap_number", name="uq_lap_identity"),
    )
    id          = Column(Integer, primary_key=True)
    session_id  = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    driver_code = Column(String(4), nullable=False)
    lap_number  = Column(Integer, nullable=False)
    lap_time_ms = Column(Integer)
    sector1_ms  = Column(Integer)
    sector2_ms  = Column(Integer)
    sector3_ms  = Column(Integer)
    compound    = Column(String(10))
    tyre_life   = Column(Integer)
    is_pb       = Column(Boolean, default=False, index=True)
    position    = Column(Integer)
    created_at  = Column(DateTime, default=datetime.utcnow)
    session     = relationship("Session", back_populates="laps")


class TelemetryFrame(Base):
    __tablename__ = "telemetry_frames"
    __table_args__ = (
        Index("idx_tel_session_driver_lap", "session_id", "driver_code", "lap_number"),
        Index("idx_tel_session_driver_time", "session_id", "driver_code", "time_ms"),
    )
    id          = Column(Integer, primary_key=True)
    session_id  = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    driver_code = Column(String(4), nullable=False)
    lap_number  = Column(Integer)
    time_ms     = Column(Integer, nullable=False)
    speed       = Column(Float)
    throttle    = Column(Float)
    brake       = Column(Boolean)
    rpm         = Column(Integer)
    gear        = Column(Integer)
    drs         = Column(Integer)
    x           = Column(Float)
    y           = Column(Float)


class RaceEvent(Base):
    __tablename__ = "race_events"
    __table_args__ = (
        Index("idx_events_session_type_lap", "session_id", "event_type", "lap_number"),
    )
    id          = Column(Integer, primary_key=True)
    session_id  = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    lap_number  = Column(Integer)
    time_ms     = Column(Integer)
    event_type  = Column(String(30), nullable=False)
    description = Column(Text)
    driver_code = Column(String(4))
    data        = Column(JSON)
    created_at  = Column(DateTime, default=datetime.utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"
    id         = Column(Integer, primary_key=True)
    key        = Column(String(64), unique=True, nullable=False, index=True)
    name       = Column(String(100))
    email      = Column(String(200))
    tier       = Column(String(20), default="free")
    requests   = Column(Integer, default=0)
    active     = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

"""
FastF1 data ingestion service.
Imports race sessions and stores telemetry in PostgreSQL.
"""
import fastf1
import pandas as pd
from pathlib import Path

import tempfile, os
CACHE_DIR = Path(os.environ.get("FASTF1_CACHE", Path(tempfile.gettempdir()) / "fastf1_cache"))
CACHE_DIR.mkdir(exist_ok=True, parents=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))


def load_session(year: int, gp: str, session_type: str = "R"):
    session = fastf1.get_session(year, gp, session_type)
    session.load()
    return session


def get_session_laps(year: int, gp: str, session_type: str = "R") -> list:
    session = load_session(year, gp, session_type)
    results = []
    for _, lap in session.laps.iterrows():
        if pd.isna(lap["LapTime"]):
            continue
        results.append({
            "driver": lap["Driver"],
            "lap_number": int(lap["LapNumber"]),
            "lap_time_ms": int(lap["LapTime"].total_seconds() * 1000),
            "sector1_ms": int(lap["Sector1Time"].total_seconds() * 1000) if not pd.isna(lap["Sector1Time"]) else None,
            "sector2_ms": int(lap["Sector2Time"].total_seconds() * 1000) if not pd.isna(lap["Sector2Time"]) else None,
            "sector3_ms": int(lap["Sector3Time"].total_seconds() * 1000) if not pd.isna(lap["Sector3Time"]) else None,
            "compound": lap["Compound"],
            "tyre_life": int(lap["TyreLife"]) if not pd.isna(lap["TyreLife"]) else 0,
            "is_pb": bool(lap["IsPersonalBest"]),
            "position": int(lap["Position"]) if not pd.isna(lap.get("Position", float("nan"))) else None,
        })
    return results


def get_driver_telemetry(year: int, gp: str, driver: str, lap_number: int = None, session_type: str = "R") -> dict:
    session = load_session(year, gp, session_type)
    laps = session.laps.pick_driver(driver)
    lap = laps.pick_lap(lap_number) if lap_number else laps.pick_fastest()
    tel = lap.get_car_data().add_distance()
    return {
        "driver": driver,
        "lap_number": int(lap["LapNumber"]),
        "lap_time_ms": int(lap["LapTime"].total_seconds() * 1000),
        "compound": lap["Compound"],
        "data": {
            "time_ms":  tel["Time"].dt.total_seconds().mul(1000).astype(int).tolist(),
            "speed":    tel["Speed"].round(1).tolist(),
            "throttle": tel["Throttle"].round(1).tolist(),
            "brake":    tel["Brake"].astype(int).tolist(),
            "rpm":      tel["RPM"].astype(int).tolist(),
            "gear":     tel["nGear"].astype(int).tolist(),
            "drs":      tel["DRS"].astype(int).tolist(),
            "distance": tel["Distance"].round(1).tolist(),
            "x":        tel.get("X", pd.Series(dtype=float)).round(1).tolist() if "X" in tel else [],
            "y":        tel.get("Y", pd.Series(dtype=float)).round(1).tolist() if "Y" in tel else [],
        }
    }

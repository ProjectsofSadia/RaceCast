"""
RaceCast Data Import Service
-----------------------------
Downloads FastF1 session data and stores it in PostgreSQL.
Run this to populate the database before going live.

Usage:
    python -m app.services.importer --season 2025
    python -m app.services.importer --season 2025 --race "Monaco" --session Race
"""
import asyncio
import argparse
import fastf1
import pandas as pd
from pathlib import Path
from datetime import datetime

import tempfile, os
CACHE_DIR = Path(os.environ.get("FASTF1_CACHE", Path(tempfile.gettempdir()) / "fastf1_cache"))
CACHE_DIR.mkdir(exist_ok=True, parents=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

SESSIONS_TO_IMPORT = ["FP1", "FP2", "FP3", "Q", "R"]
SEASON_RACES = {
    2025: [
        (1,  "Bahrain"),
        (2,  "Saudi Arabia"),
        (3,  "Australia"),
        (4,  "Japan"),
        (5,  "China"),
        (6,  "Monaco"),
        (7,  "Canada"),
        (8,  "Spain"),
        (9,  "Britain"),
        (10, "Hungary"),
        (11, "Belgium"),
        (12, "Netherlands"),
        (13, "Italy"),
        (14, "Azerbaijan"),
        (15, "Singapore"),
        (16, "United States"),
        (17, "Mexico"),
        (18, "Brazil"),
        (19, "Las Vegas"),
        (20, "Qatar"),
        (21, "Abu Dhabi"),
    ],
    2024: [
        (1, "Bahrain"), (2, "Saudi Arabia"), (3, "Australia"),
        (5, "China"), (6, "Monaco"), (9, "Britain"),
        (15, "Italy"), (19, "United States"), (22, "Abu Dhabi"),
    ],
}


async def import_session(year: int, gp: str, session_type: str, db_session):
    from app.db.models import Race, Session, Lap, TelemetryFrame
    from app.db.queries import bulk_insert_laps, bulk_insert_telemetry
    from sqlalchemy import select, and_

    print(f"Importing {year} {gp} {session_type}...")

    try:
        ff1_session = fastf1.get_session(year, gp, session_type)
        ff1_session.load(telemetry=True, weather=False, messages=False)
    except Exception as e:
        print(f"  SKIP: {e}")
        return

    # Get or create Race record
    result = await db_session.execute(
        select(Race).where(and_(Race.season == year, Race.name.ilike(f"%{gp}%")))
    )
    race = result.scalar_one_or_none()
    if not race:
        race = Race(
            season=year, round=0, name=ff1_session.event["EventName"],
            circuit=ff1_session.event["Location"],
            country=ff1_session.event["Country"],
            date=ff1_session.date,
        )
        db_session.add(race)
        await db_session.flush()

    # Get or create Session record
    result = await db_session.execute(
        select(Session).where(
            and_(Session.race_id == race.id, Session.session_type == session_type)
        )
    )
    session_rec = result.scalar_one_or_none()
    if not session_rec:
        session_rec = Session(
            race_id=race.id, session_type=session_type,
            date=ff1_session.date, imported=False,
        )
        db_session.add(session_rec)
        await db_session.flush()
    elif session_rec.imported:
        print(f"  Already imported, skipping.")
        return

    # Import laps
    lap_rows = []
    for _, lap in ff1_session.laps.iterrows():
        if pd.isna(lap["LapTime"]):
            continue
        lap_rows.append({
            "session_id":  session_rec.id,
            "driver_code": lap["Driver"],
            "lap_number":  int(lap["LapNumber"]),
            "lap_time_ms": int(lap["LapTime"].total_seconds() * 1000),
            "sector1_ms":  int(lap["Sector1Time"].total_seconds() * 1000) if not pd.isna(lap["Sector1Time"]) else None,
            "sector2_ms":  int(lap["Sector2Time"].total_seconds() * 1000) if not pd.isna(lap["Sector2Time"]) else None,
            "sector3_ms":  int(lap["Sector3Time"].total_seconds() * 1000) if not pd.isna(lap["Sector3Time"]) else None,
            "compound":    lap["Compound"],
            "tyre_life":   int(lap["TyreLife"]) if not pd.isna(lap.get("TyreLife", float("nan"))) else 0,
            "is_pb":       bool(lap.get("IsPersonalBest", False)),
            "position":    int(lap["Position"]) if not pd.isna(lap.get("Position", float("nan"))) else None,
        })

    if lap_rows:
        await bulk_insert_laps(db_session, lap_rows)
        print(f"  Laps: {len(lap_rows)}")

    # Import telemetry (sample every 5th frame to keep DB size reasonable)
    tel_rows = []
    drivers = ff1_session.laps["Driver"].unique()
    for driver in drivers:
        driver_laps = ff1_session.laps.pick_driver(driver)
        for lap_num in driver_laps["LapNumber"].unique():
            try:
                lap_obj = driver_laps[driver_laps["LapNumber"] == lap_num].iloc[0]
                tel = lap_obj.get_car_data().add_distance()
                for i, (_, row) in enumerate(tel.iterrows()):
                    if i % 5 != 0:  # keep every 5th frame ~ 10Hz
                        continue
                    tel_rows.append({
                        "session_id":  session_rec.id,
                        "driver_code": driver,
                        "lap_number":  int(lap_num),
                        "time_ms":     int(row["Time"].total_seconds() * 1000),
                        "speed":       float(row["Speed"]) if not pd.isna(row["Speed"]) else None,
                        "throttle":    float(row["Throttle"]) if not pd.isna(row["Throttle"]) else None,
                        "brake":       bool(row["Brake"]),
                        "rpm":         int(row["RPM"]) if not pd.isna(row["RPM"]) else None,
                        "gear":        int(row["nGear"]) if not pd.isna(row["nGear"]) else None,
                        "drs":         int(row["DRS"]) if not pd.isna(row["DRS"]) else None,
                    })
            except Exception:
                continue

        # Flush every 50k rows to avoid memory issues
        if len(tel_rows) >= 50_000:
            await bulk_insert_telemetry(db_session, tel_rows)
            print(f"  Telemetry batch: {len(tel_rows)} frames")
            tel_rows = []

    if tel_rows:
        await bulk_insert_telemetry(db_session, tel_rows)
        print(f"  Telemetry: {len(tel_rows)} frames")

    session_rec.imported = True
    await db_session.commit()
    print(f"  Done: {year} {gp} {session_type}")


async def import_season(year: int, gp_filter: str = None, session_filter: str = None, limit: int = None):
    from app.db.database import AsyncSessionLocal
    from app.db.models import Base
    from app.db.database import engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    races = SEASON_RACES.get(year, [])
    if gp_filter:
        races = [(r, g) for r, g in races if gp_filter.lower() in g.lower()]
    if limit:
        races = races[:limit]

    sessions = [session_filter] if session_filter else SESSIONS_TO_IMPORT

    print(f"Importing {len(races)} race(s) x {len(sessions)} session(s) for {year}...")
    async with AsyncSessionLocal() as db:
        for round_num, gp in races:
            for sess in sessions:
                try:
                    await import_session(year, gp, sess, db)
                except Exception as e:
                    print(f"  ! Skipped {gp} {sess}: {e}")
    print("Import complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, default=2025)
    parser.add_argument("--race", type=str, default=None,
                        help="Filter to one GP, e.g. Monaco. Omit to import multiple.")
    parser.add_argument("--session", type=str, default="R",
                        help="Session type. Default 'R' (Race only) to stay within free DB limits. Use 'all' for FP/Q/R.")
    parser.add_argument("--limit", type=int, default=None,
                        help="Max number of races to import (e.g. --limit 5 for first 5 GPs).")
    args = parser.parse_args()

    session_arg = None if args.session == "all" else args.session
    asyncio.run(import_season(args.season, args.race, session_arg, args.limit))

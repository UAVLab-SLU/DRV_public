"""Supported simulator models and AirSim settings translation."""

AURELIA_PAWN = {"PawnBP": "Class'/Game/Blueprints/BP_FlyingPawn_Aurelia.BP_FlyingPawn_Aurelia_C'"}


def resolve_drone_model(model):
    model = model or "AirSim"
    if model not in ("AirSim", "Aurelia"):
        raise ValueError(f"Unsupported drone model: {model}. Choose AirSim or Aurelia.")
    return model


def apply_drone_model(settings, vehicle):
    model = resolve_drone_model(vehicle.get("droneModel"))
    vehicle["PawnPath"] = "Aurelia" if model == "Aurelia" else ""
    vehicle["VehicleType"] = "SimpleFlight"
    if model == "Aurelia":
        settings.setdefault("PawnPaths", {})["Aurelia"] = dict(AURELIA_PAWN)

# Drone models

The Model selector supports AirSim (the default quadcopter) and Aurelia X6 Pro v2 (hexacopter). AirSim GPS and Aurelia GPS are disabled previews because the backend and simulator do not support them yet. Other placeholder models have been removed.

Mission requests use `"droneModel": "AirSim"` or `"droneModel": "Aurelia"`. Omitting the model, or supplying an empty model, selects AirSim. Unsupported model identifiers are rejected; update older saved configurations to one of these two identifiers.

For Aurelia, the backend adds this entry to generated AirSim settings and sets the selected vehicle's `PawnPath` to `Aurelia`:

```json
"PawnPaths": {
  "Aurelia": {
    "PawnBP": "Class'/Game/Blueprints/BP_FlyingPawn_Aurelia.BP_FlyingPawn_Aurelia_C'"
  }
}
```

AirSim vehicles use the simulator's default pawn. Both models use `SimpleFlight`, and a fleet can mix them. The simulator build must contain the Aurelia blueprint at the path above.

[Four-drone settings example](examples/airsim-aurelia/settings.json) preserves the positions and time of day from the supplied example. Copy it to `Documents/AirSim/settings.json` to use it directly. It contains only the Aurelia custom pawn entry and assigns all four drones to it. To switch a vehicle back to AirSim, remove its `PawnPath` field. The original supplied file is unchanged.

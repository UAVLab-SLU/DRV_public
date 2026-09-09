export const DRONELUME_ACTIONS = [
  { value: "Idle", hint: "Wait for the specified duration." },
  { value: "SetMySpeed", hint: "Parameters: movement speed." },
  { value: "Loiter", hint: "Parameters: loiter radius." },
  { value: "MoveToLocation", hint: "Location: x,y,z." },
  { value: "MoveToTarget", hint: "Target: another pawn identifier." },
  { value: "Attack", hint: "Target: another pawn identifier." },
  { value: "Shoot", hint: "Alias for Attack." },
  { value: "PlayAnimation", hint: "Parameters: animation asset or hint." },
  { value: "AttachToHand", hint: "Parameters: asset to attach." },
  { value: "DetachFromHand", hint: "Detach the currently held asset." },
  { value: "Flee", hint: "Parameters: optional flee speed." },
  { value: "Escape", hint: "Alias for Flee." },
  { value: "Destroy", hint: "Destroy this actor." },
];

export const DRONELUME_LEVEL_SIZES = ["small", "medium", "small_indoor"];

export const DRONELUME_FALLBACK_CATALOG = {
  goal_types: ["search", "test"],
  target_assets: ["GenericHumanAICharacter", "Human_Target_Model_05"],
  target_types: ["human"],
  target_signatures: ["visible"],
  level_sizes: DRONELUME_LEVEL_SIZES,
  level_types: ["urban", "woods"],
  times_of_day: ["09:00", "10:00", "11:00", "13:00", "15:00", "16:00"],
  weather_types: ["clear", "fog", "rain"],
  weather_intensities: [0, 0.1, 0.7, 1],
  static_assets: ["terrain_flat"],
  dynamic_assets: ["GenericHumanAICharacter"],
  procedural_assets: ["PCG_ped_crowd_1"],
  behavior_orders: ["Sequential", "immediate", "A", "B"],
  behavior_tree_assets: [],
  actions: Object.fromEntries(DRONELUME_ACTIONS.map(({ value, hint }) => [
    value,
    { description: hint, parameters: [] },
  ])),
  default_sut_asset: "/AirSim/Blueprints/BP_FlyingPawn.BP_FlyingPawn_C",
  sut_asset_by_drone_model: {},
};

export const createDroneLumeTemplate = () => ({
  Scenario: {
    Metadata: {
      name: "NewDroneLumeScenario",
      version: "1.0",
      Author: "",
      Date: new Date().toISOString().slice(0, 10),
      Description: "",
      UseCase: [],
    },
    Goal: {
      type: "test",
      Objective: "",
      Target: {
        AssetName: "GenericHumanAICharacter",
        Type: "human",
        Signature: "visible",
      },
    },
    Level: {
      size: "small",
      type: "urban",
      TimeOfDay: "13:00",
      Weather: { type: "clear", intensity: 1 },
    },
    Actors: { Static: {}, Dynamic: {}, Procedural: { Seed: 0 } },
  },
});

export const createActor = (dynamic = false) => ({
  AssetName: dynamic ? "GenericHumanAICharacter" : "terrain_flat",
  ...(dynamic ? { PawnIdentifier: "pawn", behavior: [] } : {}),
  location: { Cartesian: true, x: 0, y: 0, z: 0 },
  orientation: { pitch: 0, yaw: 0, roll: 0 },
});

export const createBehavior = () => ({
  action: "Idle",
  target: "",
  duration: 1,
  order: "Sequential",
  location: "",
  parameters: "",
  stage_name: "",
  trigger: "",
  behavior_tree_asset: "",
});

export const createProceduralActor = () => ({
  AssetName: "PCG_ped_crowd_1",
  density: 0.3,
  coverage: 0,
});

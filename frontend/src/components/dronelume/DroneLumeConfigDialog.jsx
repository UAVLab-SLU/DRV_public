import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  DRONELUME_FALLBACK_CATALOG,
  createActor,
  createBehavior,
  createDroneLumeTemplate,
  createProceduralActor,
} from "../../constants/dronelume";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const fieldSx = { minWidth: 150, flex: 1 };
const deepClone = (value) => JSON.parse(JSON.stringify(value));
const asNumber = (value) => (value === "" ? 0 : Number(value));

function withoutMissionOwnedSuT(value) {
  const next = deepClone(value);
  if (next?.Scenario) delete next.Scenario.SuT;
  return next;
}

function nextId(section, prefix) {
  let index = Object.keys(section).length + 1;
  while (section[`${prefix}${index}`]) index += 1;
  return `${prefix}${index}`;
}

function Section({ title, children, defaultExpanded = false }) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  defaultExpanded: PropTypes.bool,
};

function CatalogSelect({ label, value, options, onChange, allowEmpty = false, sx = fieldSx }) {
  const normalizedOptions = options ?? [];
  return (
    <FormControl size="small" sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty && <MenuItem value=""><em>None</em></MenuItem>}
        {normalizedOptions.map((option) => (
          <MenuItem key={String(option)} value={option}>{String(option)}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

CatalogSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  allowEmpty: PropTypes.bool,
  sx: PropTypes.object,
};

function LocationFields({ value, onChange, prefix = "" }) {
  const location = { Cartesian: true, x: 0, y: 0, z: 0, ...(value ?? {}) };
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {prefix}relative Cartesian coordinates from the DroneLume world center
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 0.5 }}>
        {["x", "y", "z"].map((coordinate) => (
          <TextField
            key={coordinate}
            label={`${prefix}${coordinate.toUpperCase()} (m)`}
            type="number"
            size="small"
            value={location[coordinate] ?? 0}
            onChange={(event) => onChange({
              ...location,
              Cartesian: true,
              [coordinate]: asNumber(event.target.value),
            })}
            sx={fieldSx}
          />
        ))}
      </Stack>
    </Box>
  );
}

LocationFields.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  prefix: PropTypes.string,
};

function BehaviorLocationFields({ value, onChange }) {
  const values = String(value ?? "").split(",");
  const update = (index, nextValue) => {
    const next = [values[0] ?? "0", values[1] ?? "0", values[2] ?? "0"];
    next[index] = nextValue;
    onChange(next.join(","));
  };
  return (
    <Stack direction="row" spacing={0.5} sx={fieldSx}>
      {["X", "Y", "Z"].map((coordinate, index) => (
        <TextField
          key={coordinate}
          label={coordinate}
          type="number"
          size="small"
          value={values[index] ?? ""}
          onChange={(event) => update(index, event.target.value)}
        />
      ))}
    </Stack>
  );
}

BehaviorLocationFields.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

function ParameterSelect({ action, value, actions, onChange }) {
  const options = actions[action]?.parameters ?? [];
  const encodedValue = JSON.stringify(value ?? "");
  return (
    <FormControl size="small" sx={fieldSx}>
      <InputLabel>Parameters</InputLabel>
      <Select
        label="Parameters"
        value={encodedValue}
        onChange={(event) => onChange(JSON.parse(event.target.value))}
      >
        <MenuItem value={JSON.stringify("")}><em>None</em></MenuItem>
        {options.map((option) => {
          const encoded = JSON.stringify(option);
          const label = Array.isArray(option) ? option.join(", ") : String(option);
          return <MenuItem key={encoded} value={encoded}>{label}</MenuItem>;
        })}
      </Select>
    </FormControl>
  );
}

ParameterSelect.propTypes = {
  action: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  actions: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ActorEditor({ actorId, actor, dynamic, catalog, pawnOptions, triggerOptions, onRename, onChange, onDelete }) {
  const actions = catalog.actions ?? {};
  const updateBehavior = (index, key, value) => {
    const behavior = (actor.behavior ?? []).map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item,
    );
    onChange({ ...actor, behavior });
  };
  const updateAction = (index, action) => {
    const behavior = (actor.behavior ?? []).map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            action,
            parameters: "",
            ...(action === "MoveToLocation" ? { location: "0,0,0" } : {}),
          }
        : item,
    );
    onChange({ ...actor, behavior });
  };

  return (
    <Box sx={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 1, p: 1.5, mb: 1.5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
        <TextField label="Actor ID" size="small" value={actorId} onChange={(event) => onRename(event.target.value)} sx={fieldSx} />
        <CatalogSelect
          label="Asset name"
          value={actor.AssetName ?? ""}
          options={dynamic ? catalog.dynamic_assets : catalog.static_assets}
          onChange={(AssetName) => onChange({ ...actor, AssetName })}
        />
        {dynamic && (
          <TextField label="Pawn identifier" size="small" value={actor.PawnIdentifier ?? ""} onChange={(event) => onChange({ ...actor, PawnIdentifier: event.target.value })} sx={fieldSx} />
        )}
        <IconButton aria-label={`Delete ${actorId}`} onClick={onDelete} color="error"><DeleteOutlineIcon /></IconButton>
      </Stack>
      <LocationFields value={actor.location} onChange={(location) => onChange({ ...actor, location })} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
        {["pitch", "yaw", "roll"].map((angle) => (
          <TextField
            key={angle}
            label={angle}
            type="number"
            size="small"
            value={actor.orientation?.[angle] ?? 0}
            onChange={(event) => onChange({
              ...actor,
              orientation: { ...actor.orientation, [angle]: asNumber(event.target.value) },
            })}
            sx={fieldSx}
          />
        ))}
      </Stack>

      {dynamic && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Operations</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => onChange({ ...actor, behavior: [...(actor.behavior ?? []), createBehavior()] })}>
              Add operation
            </Button>
          </Stack>
          {(actor.behavior ?? []).map((behavior, index) => {
            const action = behavior.action ?? Object.keys(actions)[0] ?? "Idle";
            const needsLocation = action === "MoveToLocation";
            return (
              <Box key={`${actorId}-behavior-${index}`} sx={{ bgcolor: "rgba(255,255,255,0.035)", borderRadius: 1, p: 1, mt: 1 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
                  <CatalogSelect label="Action" value={action} options={Object.keys(actions)} onChange={(value) => updateAction(index, value)} />
                  <TextField label="Stage name" size="small" value={behavior.stage_name ?? ""} onChange={(event) => updateBehavior(index, "stage_name", event.target.value)} sx={fieldSx} />
                  <CatalogSelect label="Order / track" value={behavior.order ?? ""} options={catalog.behavior_orders} onChange={(value) => updateBehavior(index, "order", value)} allowEmpty />
                  <TextField label="Duration" type="number" size="small" value={behavior.duration ?? 0} onChange={(event) => updateBehavior(index, "duration", asNumber(event.target.value))} sx={fieldSx} />
                  <IconButton aria-label="Delete behavior" onClick={() => onChange({ ...actor, behavior: actor.behavior.filter((_, itemIndex) => itemIndex !== index) })} color="error"><DeleteOutlineIcon /></IconButton>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
                  <CatalogSelect label="Target pawn" value={behavior.target ?? ""} options={pawnOptions} onChange={(value) => updateBehavior(index, "target", value)} allowEmpty />
                  {needsLocation && <BehaviorLocationFields value={behavior.location ?? ""} onChange={(value) => updateBehavior(index, "location", value)} />}
                  <ParameterSelect action={action} value={behavior.parameters} actions={actions} onChange={(value) => updateBehavior(index, "parameters", value)} />
                  <CatalogSelect label="Trigger" value={behavior.trigger ?? ""} options={triggerOptions} onChange={(value) => updateBehavior(index, "trigger", value)} allowEmpty />
                  <CatalogSelect label="Behavior tree asset" value={behavior.behavior_tree_asset ?? ""} options={catalog.behavior_tree_assets} onChange={(value) => updateBehavior(index, "behavior_tree_asset", value)} allowEmpty />
                </Stack>
                <Typography variant="caption" color="text.secondary">{actions[action]?.description}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

ActorEditor.propTypes = {
  actorId: PropTypes.string.isRequired,
  actor: PropTypes.object.isRequired,
  dynamic: PropTypes.bool.isRequired,
  catalog: PropTypes.object.isRequired,
  pawnOptions: PropTypes.array.isRequired,
  triggerOptions: PropTypes.array.isRequired,
  onRename: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function MissionSuTPreview({ drones, catalog }) {
  if (!drones.length) {
    return <Alert severity="info">Configure a drone in the Mission tab. Its model and relative home coordinates will create the final SuT block.</Alert>;
  }
  const drone = drones[0];
  const asset = catalog.sut_asset_by_drone_model?.[drone.droneModel] ?? catalog.default_sut_asset;
  return (
    <Alert severity="info">
      SuT comes from the first Mission drone: {drone.Name ?? drone.droneName ?? "Drone 1"}, asset {asset}, start ({drone.X ?? 0}, {drone.Y ?? 0}, {drone.Z ?? 0}).
    </Alert>
  );
}

MissionSuTPreview.propTypes = {
  drones: PropTypes.array.isRequired,
  catalog: PropTypes.object.isRequired,
};

export default function DroneLumeConfigDialog({ open, initialConfig, initialSource, missionDrones = [], onClose, onSave }) {
  const [draft, setDraft] = useState(createDroneLumeTemplate());
  const [rawJson, setRawJson] = useState("");
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState([]);
  const [validating, setValidating] = useState(false);
  const [contract, setContract] = useState(null);
  const catalog = contract?.catalog ?? DRONELUME_FALLBACK_CATALOG;

  useEffect(() => {
    if (!open) return;
    const next = withoutMissionOwnedSuT(initialConfig ?? createDroneLumeTemplate());
    setDraft(next);
    setRawJson(JSON.stringify(next, null, 2));
    setTab(initialSource === "llm" || initialSource === "imported" ? 1 : 0);
    setErrors([]);
    fetch(`${BASE_URL}/api/dronelume/schema`)
      .then((response) => response.ok ? response.json() : null)
      .then(setContract)
      .catch(() => setContract(null));
  }, [initialConfig, initialSource, open]);

  const scenario = draft.Scenario;
  const metadata = scenario.Metadata;
  const goal = scenario.Goal;
  const level = scenario.Level;
  const actors = scenario.Actors;
  const dynamicActors = Object.values(actors.Dynamic ?? {});
  const pawnOptions = dynamicActors.map((actor) => actor.PawnIdentifier).filter(Boolean);
  const triggerOptions = useMemo(() => {
    const stages = dynamicActors.flatMap((actor) => (actor.behavior ?? []).map((behavior) => behavior.stage_name)).filter(Boolean);
    return [...new Set([...pawnOptions, ...stages])];
  }, [dynamicActors, pawnOptions]);

  const updateScenario = (key, value) => setDraft((current) => ({
    ...current,
    Scenario: { ...current.Scenario, [key]: value },
  }));
  const updateActorSection = (sectionName, nextSection) => updateScenario("Actors", { ...actors, [sectionName]: nextSection });
  const renameActor = (sectionName, oldId, newId) => {
    if (!newId.trim() || (newId !== oldId && actors[sectionName][newId])) return;
    const entries = Object.entries(actors[sectionName]).map(([id, value]) => [id === oldId ? newId : id, value]);
    updateActorSection(sectionName, Object.fromEntries(entries));
  };
  const actorSections = [
    { key: "Static", title: "Static actors", prefix: "Object", dynamic: false },
    { key: "Dynamic", title: "Dynamic actors and operations", prefix: "Actor", dynamic: true },
  ];

  const handleTabChange = (_, value) => {
    if (value === 1) setRawJson(JSON.stringify(withoutMissionOwnedSuT(draft), null, 2));
    setTab(value);
    setErrors([]);
  };

  const validateAndSave = async () => {
    let document = withoutMissionOwnedSuT(draft);
    if (tab === 1) {
      try {
        document = withoutMissionOwnedSuT(JSON.parse(rawJson));
      } catch (error) {
        setErrors([{ path: "$", message: error.message }]);
        return;
      }
    }
    setValidating(true);
    setErrors([]);
    try {
      const response = await fetch(`${BASE_URL}/api/dronelume/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_dsl: document }),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.details ?? [{ path: "$", message: result.error ?? "Validation failed" }]);
        return;
      }
      onSave(withoutMissionOwnedSuT(result.init_dsl), tab === 0 ? "manual" : "llm");
    } catch (error) {
      setErrors([{ path: "$", message: `Backend validation is unavailable: ${error.message}` }]);
    } finally {
      setValidating(false);
    }
  };

  const copyContract = async () => navigator.clipboard.writeText(JSON.stringify(contract ?? {
    instruction: "Generate one InitDSL object using only catalog values. Omit Scenario.SuT because Mission supplies it.",
    catalog,
    template: createDroneLumeTemplate(),
  }, null, 2));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle>Configure DroneLume InitDSL</DialogTitle>
      <Tabs value={tab} onChange={handleTabChange} sx={{ px: 3 }}>
        <Tab label="Manual builder" />
        <Tab label="LLM / JSON" />
      </Tabs>
      <DialogContent dividers sx={{ minHeight: "65vh" }}>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error) => <div key={`${error.path}-${error.message}`}><strong>{error.path}</strong>: {error.message}</div>)}
          </Alert>
        )}
        <MissionSuTPreview drones={missionDrones} catalog={catalog} />

        {tab === 1 ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Ask an LLM to produce the scenario JSON and omit SuT. The backend applies the same catalog validation and derives SuT from Mission when the task starts.
            </Alert>
            <Button startIcon={<ContentCopyIcon />} onClick={copyContract} sx={{ mb: 1 }}>Copy LLM contract</Button>
            <TextField label="InitDSL JSON" value={rawJson} onChange={(event) => setRawJson(event.target.value)} multiline minRows={24} fullWidth inputProps={{ spellCheck: false, style: { fontFamily: "monospace", fontSize: 13 } }} />
          </Box>
        ) : (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Section title="Scenario metadata" defaultExpanded>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField label="Name" size="small" value={metadata.name} onChange={(event) => updateScenario("Metadata", { ...metadata, name: event.target.value })} sx={fieldSx} />
                <TextField label="Version" size="small" value={metadata.version} onChange={(event) => updateScenario("Metadata", { ...metadata, version: event.target.value })} sx={fieldSx} />
                <TextField label="Author" size="small" value={metadata.Author} onChange={(event) => updateScenario("Metadata", { ...metadata, Author: event.target.value })} sx={fieldSx} />
                <TextField label="Date" type="date" size="small" value={metadata.Date} onChange={(event) => updateScenario("Metadata", { ...metadata, Date: event.target.value })} InputLabelProps={{ shrink: true }} sx={fieldSx} />
              </Stack>
              <TextField label="Description" size="small" value={metadata.Description} onChange={(event) => updateScenario("Metadata", { ...metadata, Description: event.target.value })} fullWidth multiline minRows={2} sx={{ mt: 1 }} />
              <TextField label="Use cases (comma separated)" size="small" value={(metadata.UseCase ?? []).join(", ")} onChange={(event) => updateScenario("Metadata", { ...metadata, UseCase: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} fullWidth sx={{ mt: 1 }} />
            </Section>

            <Section title="Goal and target">
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <CatalogSelect label="Goal type" value={goal.type ?? ""} options={catalog.goal_types} onChange={(type) => updateScenario("Goal", { ...goal, type })} />
                <TextField label="Objective" size="small" value={goal.Objective ?? ""} onChange={(event) => updateScenario("Goal", { ...goal, Objective: event.target.value })} sx={{ ...fieldSx, flex: 2 }} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
                <CatalogSelect label="Target asset" value={goal.Target?.AssetName ?? ""} options={catalog.target_assets} onChange={(AssetName) => updateScenario("Goal", { ...goal, Target: { ...goal.Target, AssetName } })} />
                <CatalogSelect label="Target type" value={goal.Target?.Type ?? ""} options={catalog.target_types} onChange={(Type) => updateScenario("Goal", { ...goal, Target: { ...goal.Target, Type } })} />
                <CatalogSelect label="Target signature" value={goal.Target?.Signature ?? ""} options={catalog.target_signatures} onChange={(Signature) => updateScenario("Goal", { ...goal, Target: { ...goal.Target, Signature } })} />
                <CatalogSelect label="Target pawn" value={goal.Target?.PawnIdentifier ?? ""} options={pawnOptions} onChange={(PawnIdentifier) => updateScenario("Goal", { ...goal, Target: { ...goal.Target, PawnIdentifier } })} allowEmpty />
              </Stack>
            </Section>

            <Section title="Level and weather" defaultExpanded>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <CatalogSelect label="Level size" value={level.size} options={catalog.level_sizes} onChange={(size) => updateScenario("Level", { ...level, size })} />
                <CatalogSelect label="Level type" value={level.type ?? ""} options={catalog.level_types} onChange={(type) => updateScenario("Level", { ...level, type })} />
                <CatalogSelect label="Time of day" value={level.TimeOfDay ?? ""} options={catalog.times_of_day} onChange={(TimeOfDay) => updateScenario("Level", { ...level, TimeOfDay })} allowEmpty />
                <CatalogSelect label="Weather type" value={level.Weather?.type ?? ""} options={catalog.weather_types} onChange={(type) => updateScenario("Level", { ...level, Weather: { ...level.Weather, type } })} />
                <CatalogSelect label="Weather intensity" value={level.Weather?.intensity ?? 1} options={catalog.weather_intensities} onChange={(intensity) => updateScenario("Level", { ...level, Weather: { ...level.Weather, intensity } })} />
              </Stack>
            </Section>

            {actorSections.map((section) => (
              <Section key={section.key} title={section.title}>
                {Object.entries(actors[section.key]).map(([actorId, actor]) => (
                  <ActorEditor key={actorId} actorId={actorId} actor={actor} dynamic={section.dynamic} catalog={catalog} pawnOptions={pawnOptions} triggerOptions={triggerOptions} onRename={(newId) => renameActor(section.key, actorId, newId)} onChange={(nextActor) => updateActorSection(section.key, { ...actors[section.key], [actorId]: nextActor })} onDelete={() => updateActorSection(section.key, Object.fromEntries(Object.entries(actors[section.key]).filter(([id]) => id !== actorId)))} />
                ))}
                <Button startIcon={<AddIcon />} onClick={() => {
                  const id = nextId(actors[section.key], section.prefix);
                  const actor = createActor(section.dynamic);
                  actor.AssetName = (section.dynamic ? catalog.dynamic_assets : catalog.static_assets)[0] ?? "";
                  if (section.dynamic) actor.PawnIdentifier = id.toLowerCase();
                  updateActorSection(section.key, { ...actors[section.key], [id]: actor });
                }}>Add {section.dynamic ? "dynamic" : "static"} actor</Button>
              </Section>
            ))}

            <Section title="Procedural actors">
              <TextField label="Seed" type="number" size="small" value={actors.Procedural.Seed ?? 0} onChange={(event) => updateActorSection("Procedural", { ...actors.Procedural, Seed: asNumber(event.target.value) })} sx={{ mb: 1 }} />
              {Object.entries(actors.Procedural).filter(([id]) => id !== "Seed").map(([actorId, actor]) => (
                <Stack key={actorId} direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1 }} alignItems="center">
                  <TextField label="Entry ID" size="small" value={actorId} onChange={(event) => renameActor("Procedural", actorId, event.target.value)} sx={fieldSx} />
                  <CatalogSelect label="Asset name" value={actor.AssetName ?? ""} options={catalog.procedural_assets} onChange={(AssetName) => updateActorSection("Procedural", { ...actors.Procedural, [actorId]: { ...actor, AssetName } })} sx={{ ...fieldSx, flex: 2 }} />
                  <TextField label="Density" type="number" size="small" value={actor.density ?? 0} onChange={(event) => updateActorSection("Procedural", { ...actors.Procedural, [actorId]: { ...actor, density: asNumber(event.target.value) } })} sx={fieldSx} />
                  <TextField label="Coverage" type="number" size="small" value={actor.coverage ?? 0} onChange={(event) => updateActorSection("Procedural", { ...actors.Procedural, [actorId]: { ...actor, coverage: asNumber(event.target.value) } })} sx={fieldSx} />
                  <IconButton aria-label={`Delete ${actorId}`} color="error" onClick={() => updateActorSection("Procedural", Object.fromEntries(Object.entries(actors.Procedural).filter(([id]) => id !== actorId)))}><DeleteOutlineIcon /></IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={() => {
                const id = nextId(actors.Procedural, "Procedural");
                updateActorSection("Procedural", { ...actors.Procedural, [id]: { ...createProceduralActor(), AssetName: catalog.procedural_assets[0] ?? "" } });
              }}>Add procedural actor</Button>
            </Section>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: "auto", ml: 1 }}>Final output: InitDSL.json with Mission-derived SuT</Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={validateAndSave} disabled={validating}>{validating ? "Validating..." : "Validate and use DroneLume"}</Button>
      </DialogActions>
    </Dialog>
  );
}

DroneLumeConfigDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  initialConfig: PropTypes.object,
  initialSource: PropTypes.string,
  missionDrones: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

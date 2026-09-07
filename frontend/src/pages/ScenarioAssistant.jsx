import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SendIcon from "@mui/icons-material/Send";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMainJson } from "../contexts/MainJsonContext";
import { EnvironmentModel } from "../model/EnvironmentModel";
import { useThemeTokens } from "../theme/palette";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const EXAMPLE_PROMPTS = [
  "Create an active shooter scene in a densely populated area.",
  "Create a maritime search and rescue mission for a drowning person.",
  "Create a person wandering in the woods to simulate someone gone missing.",
  "Create a scene with a lot of people, four explicit and the rest procedural.",
];

function assistantText(result) {
  return [result.message, ...(result.questions ?? [])].filter(Boolean).join("\n");
}

export default function ScenarioAssistant() {
  const tokens = useThemeTokens();
  const navigate = useNavigate();
  const { envJson, setEnvJson } = useMainJson();
  const [contract, setContract] = useState(null);
  const [contractError, setContractError] = useState("");
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [rawDsl, setRawDsl] = useState("");
  const [requestError, setRequestError] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [dslValid, setDslValid] = useState(false);
  const activeRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BASE_URL}/api/dronelume/schema`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("The supported catalog could not be loaded");
        return response.json();
      })
      .then((payload) => {
        setContract(payload);
        setRawDsl(JSON.stringify(payload.template, null, 2));
        setDslValid(true);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setContractError(error.message);
      });
    return () => {
      controller.abort();
      activeRequest.current?.abort();
    };
  }, []);

  const inventory = useMemo(() => {
    const catalog = contract?.catalog;
    if (!catalog) return [];
    return [
      { label: "Actions", values: Object.keys(catalog.actions ?? {}) },
      { label: "Levels", values: catalog.level_types ?? [] },
      { label: "Weather", values: catalog.weather_types ?? [] },
      { label: "Dynamic actors", values: catalog.dynamic_assets ?? [] },
    ];
  }, [contract]);

  const stopGeneration = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setGenerating(false);
  };

  const sendMessage = async (providedInput) => {
    const content = String(providedInput ?? input).trim();
    if (!content || generating || !contract) return;
    let currentInitDsl;
    try {
      currentInitDsl = JSON.parse(rawDsl);
    } catch (error) {
      setRequestError([{ path: "$", message: `Validate the current DSL before asking the assistant to edit it: ${error.message}` }]);
      setDslValid(false);
      return;
    }
    const nextConversation = [...conversation, { role: "user", content }];
    setConversation(nextConversation);
    setInput("");
    setRequestError([]);
    setResult(null);
    setGenerating(true);

    const controller = new AbortController();
    activeRequest.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 100000);
    try {
      const response = await fetch(`${BASE_URL}/api/dronelume/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "ollama",
          messages: nextConversation,
          current_init_dsl: currentInitDsl,
        }),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok) {
        setRequestError(payload.details ?? [{ path: "$", message: payload.error ?? "The scenario assistant failed" }]);
        return;
      }

      setConversation([...nextConversation, { role: "assistant", content: assistantText(payload) }]);
      setResult(payload);
      if (payload.status === "complete" && payload.init_dsl) {
        setRawDsl(JSON.stringify(payload.init_dsl, null, 2));
        setDslValid(true);
      }
    } catch (error) {
      if (error.name === "AbortError" && timedOut) {
        setRequestError([{ path: "$", message: "The scenario assistant timed out. Please send the message again." }]);
      } else if (error.name !== "AbortError") {
        setRequestError([{ path: "$", message: `The scenario assistant is unavailable: ${error.message}` }]);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setGenerating(false);
      }
    }
  };

  const validateDsl = async () => {
    let document;
    try {
      document = JSON.parse(rawDsl);
    } catch (error) {
      setRequestError([{ path: "$", message: error.message }]);
      setDslValid(false);
      return;
    }

    setValidating(true);
    setRequestError([]);
    try {
      const response = await fetch(`${BASE_URL}/api/dronelume/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_dsl: document }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setRequestError(payload.details ?? [{ path: "$", message: payload.error ?? "Validation failed" }]);
        setDslValid(false);
        return;
      }
      setRawDsl(JSON.stringify(payload.init_dsl, null, 2));
      setDslValid(true);
    } catch (error) {
      setRequestError([{ path: "$", message: `Backend validation is unavailable: ${error.message}` }]);
      setDslValid(false);
    } finally {
      setValidating(false);
    }
  };

  const reset = () => {
    stopGeneration();
    setConversation([]);
    setInput("");
    setResult(null);
    setRawDsl(JSON.stringify(contract?.template ?? {}, null, 2));
    setRequestError([]);
    setDslValid(Boolean(contract?.template));
  };

  const copyDsl = async () => navigator.clipboard.writeText(rawDsl);
  const downloadDsl = () => {
    const blob = new Blob([`${rawDsl}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "InitDSL.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const applyDsl = async () => {
    if (!dslValid) return;
    const document = JSON.parse(rawDsl);
    setApplying(true);
    setRequestError([]);
    try {
      const response = await fetch(`${BASE_URL}/api/dronelume/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "llm", init_dsl: document }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setRequestError(payload.details ?? [{ path: "$", message: payload.error ?? "Unable to apply the DSL" }]);
        return;
      }
      envJson.SceneMode = "dronelume";
      envJson.UseGeo = false;
      envJson.DroneLumeConfig = payload.init_dsl;
      envJson.DroneLumeSource = "llm";
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
      navigate("/simulation");
    } catch (error) {
      setRequestError([{ path: "$", message: `Backend deployment is unavailable: ${error.message}` }]);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 128px)", background: tokens.surface.heroOverlay, py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: tokens.brand.soft }} />
              <Chip label="Experimental" size="small" color="warning" variant="outlined" />
              <Chip label="DroneLume DSL only" size="small" color="info" variant="outlined" />
            </Stack>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.5rem" }, color: tokens.text.primary }}>
              Scenario Assistant
            </Typography>
            <Typography sx={{ color: tokens.text.secondary, mt: 0.5, maxWidth: 760 }}>
              Describe the scenario you want. For recognized scenarios, the assistant proposes a validated baseline immediately and lets you adjust it conversationally.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            {result?.provider?.model && <Chip label={`${result.provider.name}: ${result.provider.model}`} variant="outlined" />}
            <Button startIcon={<RestartAltIcon />} onClick={reset} disabled={conversation.length === 0 && !rawDsl}>Start over</Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mb: 3 }}>
          This interface generates DroneLume InitDSL only. Mission drones, flight paths, and test requirements remain in Configuration and are not generated here yet. Scenario.SuT is intentionally omitted because Mission owns it.
        </Alert>

        {contractError && <Alert severity="error" sx={{ mb: 2 }}>{contractError}. Check that the backend is running.</Alert>}
        {requestError.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {requestError.map((error) => <div key={`${error.path}-${error.message}`}><strong>{error.path}</strong>: {error.message}</div>)}
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.45fr) minmax(340px, 0.75fr)" }, gap: 3 }}>
          <Paper elevation={0} sx={{ border: `1px solid ${tokens.brand.secondary}`, bgcolor: tokens.surface.elevated, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${tokens.brand.secondary}` }}>
              <Typography sx={{ color: tokens.text.primary, fontWeight: 700 }}>Conversation</Typography>
              <Typography variant="body2" sx={{ color: tokens.text.secondary }}>The backend supplies the current supported catalog to the model on every turn.</Typography>
            </Box>

            <Box sx={{ p: 2.5, minHeight: 390, maxHeight: 540, overflowY: "auto" }}>
              {conversation.length === 0 ? (
                <Box>
                  <Typography sx={{ color: tokens.text.secondary, mb: 2 }}>Start with a rough idea. The assistant will choose sensible supported defaults and show a ready baseline when the intent is clear.</Typography>
                  <Stack spacing={1}>
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <Button key={prompt} variant="outlined" onClick={() => sendMessage(prompt)} disabled={!contract} sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none" }}>
                        {prompt}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ) : conversation.map((message, index) => (
                <Box key={`${message.role}-${index}`} sx={{ mb: 1.5, ml: message.role === "user" ? 7 : 0, mr: message.role === "assistant" ? 7 : 0 }}>
                  <Typography variant="caption" sx={{ color: tokens.text.muted }}>{message.role === "user" ? "You" : "Scenario assistant"}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: tokens.text.primary, bgcolor: message.role === "user" ? "primary.dark" : "rgba(255,255,255,0.06)", borderRadius: 1.5, p: 1.25 }}>
                    {message.content}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ borderColor: tokens.brand.secondary }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 2 }} alignItems="flex-start">
              <TextField
                label="Describe or complete the DroneLume scenario"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                multiline
                minRows={2}
                fullWidth
                disabled={generating || !contract}
              />
              {generating ? (
                <Button variant="outlined" color="warning" startIcon={<StopCircleOutlinedIcon />} onClick={stopGeneration}>Stop</Button>
              ) : (
                <Button variant="contained" endIcon={<SendIcon />} onClick={() => sendMessage()} disabled={!input.trim() || !contract}>Send</Button>
              )}
            </Stack>
            {generating && <Typography variant="caption" sx={{ display: "block", color: tokens.text.secondary, px: 2, pb: 2 }}>Reviewing the request against the supported DroneLume inventory. A cold model start can take longer.</Typography>}
          </Paper>

          <Stack spacing={3}>
            <Paper elevation={0} sx={{ border: `1px solid ${tokens.brand.secondary}`, bgcolor: tokens.surface.elevated, borderRadius: 2, p: 2.5 }}>
              <Typography sx={{ color: tokens.text.primary, fontWeight: 700, mb: 0.5 }}>Supported inventory</Typography>
              <Typography variant="body2" sx={{ color: tokens.text.secondary, mb: 2 }}>
                Loaded from backend catalog version {contract?.catalog?.catalog_version ?? "..."}.
              </Typography>
              <Stack spacing={1.5}>
                {inventory.map((section) => (
                  <Box key={section.label}>
                    <Typography variant="caption" sx={{ color: tokens.text.muted }}>{section.label}</Typography>
                    <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {section.values.map((value) => <Chip key={value} label={value} size="small" variant="outlined" />)}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {result?.status === "clarify" && <Alert severity="info">Answer the assistant’s questions in the conversation to continue building the DSL.</Alert>}
            {result?.status === "unsupported" && (
              <Alert severity="warning">
                <div>{result.message}</div>
                {(result.unsupported ?? []).map((item) => <div key={`${item.request}-${item.reason}`}><strong>{item.request}</strong>: {item.reason}</div>)}
              </Alert>
            )}

            {rawDsl ? (
              <Paper elevation={0} sx={{ border: `1px solid ${dslValid ? tokens.status.success : tokens.brand.secondary}`, bgcolor: tokens.surface.elevated, borderRadius: 2, p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ color: tokens.text.primary, fontWeight: 700 }}>InitDSL.json</Typography>
                    <Typography variant="caption" sx={{ color: dslValid ? tokens.status.success : tokens.text.secondary }}>{dslValid ? "Backend validated" : "Edited, validation required"}</Typography>
                  </Box>
                  <Chip label={dslValid ? "Valid" : "Not validated"} color={dslValid ? "success" : "default"} size="small" />
                </Stack>
                <TextField
                  value={rawDsl}
                  onChange={(event) => {
                    setRawDsl(event.target.value);
                    setDslValid(false);
                  }}
                  multiline
                  minRows={18}
                  maxRows={28}
                  fullWidth
                  inputProps={{ spellCheck: false, style: { fontFamily: "monospace", fontSize: 12 } }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  <Button variant="contained" onClick={validateDsl} disabled={validating}>{validating ? "Validating..." : "Validate DSL"}</Button>
                  <Button variant="contained" color="success" startIcon={<PlayArrowIcon />} onClick={applyDsl} disabled={!dslValid || validating || applying}>{applying ? "Applying..." : "Apply to Configuration"}</Button>
                  <Button startIcon={<ContentCopyIcon />} onClick={copyDsl} disabled={!dslValid}>Copy</Button>
                  <Button startIcon={<DownloadIcon />} onClick={downloadDsl} disabled={!dslValid}>Download</Button>
                </Stack>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ border: `1px dashed ${tokens.brand.secondary}`, bgcolor: tokens.surface.elevated, borderRadius: 2, p: 3, textAlign: "center" }}>
                <Typography sx={{ color: tokens.text.primary, fontWeight: 700 }}>DSL preview</Typography>
                <Typography variant="body2" sx={{ color: tokens.text.secondary, mt: 0.5 }}>The validated DSL will appear here once the conversation contains sufficient supported information.</Typography>
              </Paper>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

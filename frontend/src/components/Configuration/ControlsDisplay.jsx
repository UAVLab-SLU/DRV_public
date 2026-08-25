import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import { useThemeTokens } from "../../theme/palette";

export default function ControlsDisplay({ mapControl }) {
  const tokens = useThemeTokens();
  if (!mapControl) return null;

  return (
    <Box
      sx={{
        px: 2,
        py: 0.75,
        borderBottom: `1px solid ${tokens.brand.secondary}`,
        backgroundColor: tokens.brand.primary,
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      <Typography variant="overline" sx={{ color: tokens.brand.soft, lineHeight: 1, flexShrink: 0 }}>
        {mapControl.header}
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        {mapControl.body?.map((item, i) => (
          <Tooltip key={i} title={item.info} placement="top" arrow>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "default" }}>
              {item.icon?.map((src, j) => (
                <Box
                  key={j}
                  component="img"
                  src={src}
                  alt=""
                  sx={{ height: 18, width: "auto", opacity: 0.75 }}
                />
              ))}
              <Typography variant="caption" sx={{ color: tokens.accents?.skyBlue ?? tokens.brand.soft, fontWeight: 600 }}>
                {item.command}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}

ControlsDisplay.propTypes = {
  mapControl: PropTypes.shape({
    header: PropTypes.string,
    body: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.arrayOf(PropTypes.string),
        command: PropTypes.string,
        info: PropTypes.string,
      }),
    ),
  }),
};

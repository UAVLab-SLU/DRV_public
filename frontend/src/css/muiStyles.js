import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

export const BootstrapTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: '#87CEEB',
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#87CEEB',
    color: 'black',
  },
}));

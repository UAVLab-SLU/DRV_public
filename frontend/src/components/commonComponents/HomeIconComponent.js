import { redirect, useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';

export const HomeIconComponent = () => {

    const navigate = useNavigate();

    const redirectToHome = () => {
        navigate('/')
    }

    return (
        <Tooltip title="Home" placement='bottom'>
            <HomeIcon style={{ float: 'right', cursor: 'pointer', fontSize: '35px', color: 'white' }} onClick={redirectToHome} />
        </Tooltip>
    );
}

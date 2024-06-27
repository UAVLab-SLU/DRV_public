import { redirect, useNavigate } from "react-router-dom";


export const redirectToSimulationPage = (stateObject = null) => {
    const navigate = useNavigate();
    if (stateObject) {
        navigate("/simulation", stateObject)
    }
    navigate("/simulation")
}

export const redirectToDashboard = ( stateObject = null) => {
    const navigate = useNavigate();
    if (stateObject) {
        navigate('/report-dashboard', stateObject);
    }
    navigate('/report-dashboard');
}
import { useLocation } from "react-router-dom";
import HorizontalLinearStepper from "../components/HorizontalLinearStepper";

export default function Wizard() {
  const location = useLocation();
  const { descs = "", title = "" } = location.state ?? {};

  return <HorizontalLinearStepper desc={descs} title={title} />;
}

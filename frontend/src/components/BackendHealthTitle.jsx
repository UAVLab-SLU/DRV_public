import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const BackendHealthTitle = ({ classes }) => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer;
    const check = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (!cancelled) setIsHealthy(res.ok);
      } catch {
        if (!cancelled) setIsHealthy(false);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          timer = setTimeout(check, 30_000);
        }
      }
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return (
    <Link
      to="/"
      className={classes?.siteTitle}
      style={{ color: isHealthy ? 'inherit' : 'red', transition: 'color 0.3s ease' }}
      title={isChecking ? 'Checking backend…' : isHealthy ? 'Backend connected' : 'Backend disconnected'}
    >
      Drone World 🚁
    </Link>
  );
};

BackendHealthTitle.propTypes = {
  classes: PropTypes.shape({ siteTitle: PropTypes.string }),
};

export default BackendHealthTitle;

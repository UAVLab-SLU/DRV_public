import { styled } from '@mui/system';
import Button from '@mui/material/Button';

export const LandingPageContainer = styled('div')({
    fontFamily: 'Roboto, sans-serif',
    color: '#fff',
    textAlign: 'center',
});

export const Nav = styled('nav')({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: '#0000CD',
    fontFamily: 'Arial, sans-serif',
});

export const SiteTitle = styled('a')({
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
});

export const MainContent = styled('div')({
    padding: '2rem',
});

export const NavList = styled('ul')({
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'Arial, sans-serif',
});

export const NavListItem = styled('li')({
    display: 'inline-block',
    marginLeft: '1rem',
});

export const AboutLink = styled(Button)({
    textDecoration: 'none',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    transition: 'background-color 0.3s ease',
});

export const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    height: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};
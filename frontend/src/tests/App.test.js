/* eslint-env jest */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders DroneWorld header text', () => {
  render(<App />);
  const header = screen.getByText(/Drone World/i);
  expect(header).toBeInTheDocument();
});

test('About Us link exists and routes to /aboutus', () => {
  render(<App />);
  const aboutUsLink = screen.getByRole('link', { name: /about us/i });
  expect(aboutUsLink).toBeInTheDocument();
  expect(aboutUsLink).toHaveAttribute('href', '/aboutus');
});

test('Saved Settings link exists and routes to /saved-settings', () => {
  render(<App />);
  const savedSettingsLink = screen.getByRole('link', { name: /saved settings/i });
  expect(savedSettingsLink).toBeInTheDocument();
  expect(savedSettingsLink).toHaveAttribute('href', '/saved-settings');
});

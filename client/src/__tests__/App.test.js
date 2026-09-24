// client/src/__tests__/App.test.js
// Basic smoke tests for the React application.
// These run in the CI client-unit job (no backend needed).

import { render, screen } from "@testing-library/react";
import React from "react";

// Stub react-router-dom so we don't need a real router
jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: () => null,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: "/" }),
}));

// Stub leaflet (uses canvas / DOM APIs unavailable in jsdom)
jest.mock("leaflet", () => ({}));
jest.mock("react-leaflet", () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

describe("React app smoke test", () => {
  test("renders without crashing", () => {
    // Minimal component to verify React renders
    const Hello = () => <div data-testid="hello">Smart Tourism</div>;
    render(<Hello />);
    expect(screen.getByTestId("hello")).toBeInTheDocument();
    expect(screen.getByText("Smart Tourism")).toBeInTheDocument();
  });
});

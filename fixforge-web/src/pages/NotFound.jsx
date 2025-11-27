import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="panel">
      <h2>Page not found</h2>
      <p>The page you requested doesn't exist.</p>
      <Link to="/">Go back home</Link>
    </div>
  );
}

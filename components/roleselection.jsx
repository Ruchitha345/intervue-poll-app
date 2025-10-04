
import React from "react";

export default function roleselection({ onSelect }) {
  return (
    <div className="page-center">
      <div className="card role-card">
        <div className="badge">Intervue Poll</div>
        <h1>Welcome to the <strong>Live Polling System</strong></h1>
        <p>Please select the role that best describes you</p>
        <div className="role-options">
          <div className="option" onClick={() => onSelect("student")}>
            <h3>I'm a Student</h3>
            <p>Submit answers and view poll results in real-time.</p>
          </div>
          <div className="option" onClick={() => onSelect("teacher")}>
            <h3>I'm a Teacher</h3>
            <p>Create polls and view real-time student responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

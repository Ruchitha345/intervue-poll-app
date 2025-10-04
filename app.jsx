
import React, { useState } from "react";
import RoleSelect from "./components/roleselection";
import Teacher from "./components/teacherdashboard";
import Student from "./components/studentdashboard";

export default function App() {
  const [role, setRole] = useState(null);
  const [pollId, setPollId] = useState(null);

  if (!role) return <RoleSelect onSelect={(r) => setRole(r)} />;
  if (role === "teacher") return <Teacher pollId={pollId} setPollId={setPollId} onBack={() => { setRole(null); setPollId(null); }} />;
  if (role === "student") return <Student pollId={pollId} setPollId={setPollId} onBack={() => { setRole(null); setPollId(null); }} />;
  return null;
}

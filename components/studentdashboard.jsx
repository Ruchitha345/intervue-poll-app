
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import PollResults from "./pollview";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function studentdashboard() {
  const [socket, setSocket] = useState(null);
  const [pollId, setPollId] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState("");
  const [results, setResults] = useState({});
  const [students, setStudents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER);
    setSocket(s);

    s.on("new_question", ({ question, duration }) => {
      setCurrentQuestion(question);
      setMyAnswer("");
      setResults({});
      setTimeLeft(duration);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t <= 1 ? (clearInterval(timerRef.current), 0) : t - 1);
      }, 1000);
    });

    s.on("results_update", ({ results }) => setResults(results));
    s.on("question_ended", ({ results }) => {
      setResults(results);
      setCurrentQuestion(null);
      setTimeLeft(0);
    });

    s.on("student_list", (list) => setStudents(list));

    return () => { if (timerRef.current) clearInterval(timerRef.current); s.disconnect(); }
  }, []);

  const handleJoin = () => {
    if (!pollId.trim() || !name.trim()) return alert("Enter Poll ID and Name");
    socket.emit("student_join", { pollId, name }, (res) => { if (res.success) setJoined(true); else alert(res.error); });
  };

  const submitAnswer = () => {
    if (!myAnswer) return;
    socket.emit("student_submit_answer", { pollId, option: myAnswer }, (res) => { if (!res.success) alert("Failed"); });
  };

  if (!joined) return (
    <div className="page-center">
      <div className="card small">
        <h3>Join Poll</h3>
        <input placeholder="Poll ID" value={pollId} onChange={e => setPollId(e.target.value)} />
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <button className="primary" onClick={handleJoin}>Join</button>
      </div>
    </div>
  );

  return (
    <div className="page-center">
      <div className="card medium">
        {!currentQuestion ? (
          <div>Waiting for teacher to ask a question...</div>
        ) : (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <h4>{currentQuestion.text}</h4>
              <span className="timer">{timeLeft}s</span>
            </div>
            <div className="options-list">
              {currentQuestion.options.map((opt, i) => (
                <label key={i} className={`option-radio ${myAnswer===opt?"selected":""}`}>
                  <input type="radio" value={opt} checked={myAnswer===opt} onChange={() => setMyAnswer(opt)} disabled={!!results[opt]} />
                  {opt}
                </label>
              ))}
            </div>
            <button className="primary" onClick={submitAnswer} disabled={!myAnswer || !!results[myAnswer]}>Submit</button>
            <PollResults results={results} totalStudents={students.length} />
          </div>
        )}
      </div>
    </div>
  );
}

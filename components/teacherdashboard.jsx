
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import PollView from "./pollview";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function teacherdashboard() {
  const [socket, setSocket] = useState(null);
  const [pollId, setPollId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionInputs, setOptionInputs] = useState(["", ""]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [results, setResults] = useState({});
  const [students, setStudents] = useState([]);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const s = io(SERVER);
    setSocket(s);

    s.on("connect", () => console.log("Teacher connected:", s.id));
    s.on("student_list", (list) => setStudents(list));
    s.on("results_update", ({ results }) => setResults(results));
    s.on("question_ended", ({ results }) => { setResults(results); setCurrentQuestion(null); });

    return () => s.disconnect();
  }, []);

  const createPoll = () => {
    socket.emit("teacher_create_poll", {}, (res) => { if(res.success) setPollId(res.pollId); });
  };

  const addQuestion = () => {
    if (!questionText.trim() || optionInputs.some(o=>!o.trim())) return alert("Enter question and options");
    socket.emit("teacher_add_question", { pollId, questionText, options: optionInputs }, (res)=>{
      if(res.success) { 
        setQuestions(prev => [...prev, { text: questionText, options: optionInputs, id: Math.random().toString(36).slice(2,8) }]);
        setQuestionText(""); setOptionInputs(["",""]);
      }
    });
  };

  const askQuestion = (qid) => socket.emit("teacher_ask_question", { pollId, qid, duration }, (res)=>{ if(!res.success) alert(res.error); });
  const endQuestion = () => socket.emit("teacher_end_question", { pollId }, (res)=>{ if(!res.success) alert(res.error); });

  return (
    <div className="page-center">
      <div className="teacher-layout">

        <div className="left">
          <div className="card small">
            <h3>Teacher</h3>
            {!pollId ? (
              <button className="primary" onClick={createPoll}>Create New Poll</button>
            ) : <div>Poll ID: <strong>{pollId}</strong></div>}
            <div style={{ marginTop:12 }}>
              <label>Duration per question (seconds)</label>
              <input type="number" min="5" max="120" value={duration} onChange={e=>setDuration(Number(e.target.value))}/>
            </div>
          </div>

          <div className="card">
            <h4>Add Question</h4>
            <input placeholder="Enter question" value={questionText} onChange={e=>setQuestionText(e.target.value)}/>
            {optionInputs.map((o,i)=>(
              <input key={i} placeholder={`Option ${i+1}`} value={o} onChange={e=>{const arr=[...optionInputs];arr[i]=e.target.value;setOptionInputs(arr)}}/>
            ))}
            <button onClick={()=>setOptionInputs(prev=>[...prev,""])}>+ Add Option</button>
            <button className="primary" onClick={addQuestion} style={{ marginTop:8 }}>Save Question</button>
          </div>
        </div>

        <div className="right">
          <div className="card">
            <h4>Questions</h4>
            <div className="questions-list">
              {questions.map(q=>(
                <div key={q.id} className="question-item">
                  <strong>{q.text}</strong>
                  <div className="options-inline">{q.options.join(" • ")}</div>
                  <button className="primary" onClick={()=>askQuestion(q.id)}>Ask Now</button>
                </div>
              ))}
              {questions.length===0 && <div>No questions yet</div>}
            </div>
          </div>

          <div className="card">
            <h4>Live Results</h4>
            {currentQuestion ? (
              <>
                <pollview results={results} totalStudents={students.length} />
                <button style={{ marginTop:8 }} onClick={endQuestion}>End Question</button>
              </>
            ) : <p>No active question</p>}

            <div style={{ marginTop:10 }}>
              <h5>Students ({students.length})</h5>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {students.map(s=><span key={s} className="badge">{s}</span>)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

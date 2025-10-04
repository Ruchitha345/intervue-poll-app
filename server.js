
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const polls = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("teacher_create_poll", (data, callback) => {
    const pollId = Math.random().toString(36).slice(2, 8);
    polls[pollId] = { questions: [], students: {}, currentQuestion: null, answers: {} };
    callback({ success: true, pollId });
  });

  socket.on("teacher_add_question", ({ pollId, questionText, options }, callback) => {
    if (!polls[pollId]) return callback({ success: false, error: "Poll not found" });
    const q = { id: Math.random().toString(36).slice(2, 8), text: questionText, options };
    polls[pollId].questions.push(q);
    callback({ success: true });
  });

  socket.on("teacher_ask_question", ({ pollId, qid, duration }, callback) => {
    const poll = polls[pollId];
    if (!poll) return callback({ success: false, error: "Poll not found" });
    const q = poll.questions.find(x => x.id === qid);
    if (!q) return callback({ success: false, error: "Question not found" });
    poll.currentQuestion = q;
    poll.answers = {};
    io.to(pollId).emit("new_question", { question: q, duration });
    callback({ success: true });
  });

  socket.on("teacher_end_question", ({ pollId }, callback) => {
    const poll = polls[pollId];
    if (!poll) return callback({ success: false, error: "Poll not found" });
    io.to(pollId).emit("question_ended", { results: poll.answers });
    poll.currentQuestion = null;
    callback({ success: true });
  });

  socket.on("student_join", ({ pollId, name }, callback) => {
    const poll = polls[pollId];
    if (!poll) return callback({ success: false, error: "Poll not found" });
    poll.students[socket.id] = name;
    socket.join(pollId);
    io.to(pollId).emit("student_list", Object.values(poll.students));
    callback({ success: true });
  });

  socket.on("student_submit_answer", ({ pollId, option }, callback) => {
    const poll = polls[pollId];
    if (!poll || !poll.currentQuestion) return callback({ success: false });
    poll.answers[option] = (poll.answers[option] || 0) + 1;
    io.to(pollId).emit("results_update", { results: poll.answers });
    callback({ success: true });
  });

  socket.on("disconnect", () => {
    for (let pollId in polls) {
      if (polls[pollId].students[socket.id]) {
        delete polls[pollId].students[socket.id];
        io.to(pollId).emit("student_list", Object.values(polls[pollId].students));
      }
    }
  });
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

httpServer.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port", process.env.PORT || 5000)
);

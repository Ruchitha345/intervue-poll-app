
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const PORT = 5000;

const polls = {};

io.on("connection", socket => {
  console.log("New connection:", socket.id);

  socket.on("teacher_create_poll", (data, callback) => {
    const pollId = Math.random().toString(36).slice(2, 8);
    polls[pollId] = { questions: [], students: [], currentQuestion: null, answers: {} };
    callback({ success: true, pollId });
  });

  socket.on("teacher_add_question", ({ pollId, questionText, options }, callback) => {
    if (!polls[pollId]) return callback({ success: false, error: "Poll not found" });
    const question = { id: Math.random().toString(36).slice(2, 8), text: questionText, options };
    polls[pollId].questions.push(question);
    callback({ success: true });
  });

  socket.on("teacher_ask_question", ({ pollId, qid, duration }, callback) => {
    const poll = polls[pollId];
    if (!poll) return callback({ success: false, error: "Poll not found" });
    const question = poll.questions.find(q => q.id === qid);
    if (!question) return callback({ success: false, error: "Question not found" });

    poll.currentQuestion = question;
    poll.answers = {};
    io.to(pollId).emit("new_question", { pollId, question, duration });

    setTimeout(() => {
      if (poll.currentQuestion && poll.currentQuestion.id === question.id) {
        io.to(pollId).emit("question_ended", { pollId, results: poll.answers });
        poll.currentQuestion = null;
        poll.answers = {};
      }
    }, duration * 1000);

    callback({ success: true });
  });

  socket.on("teacher_end_question", ({ pollId }, callback) => {
    const poll = polls[pollId];
    if (!poll || !poll.currentQuestion) return callback({ success: false, error: "No active question" });
    io.to(pollId).emit("question_ended", { pollId, results: poll.answers });
    poll.currentQuestion = null;
    poll.answers = {};
    callback({ success: true });
  });

  socket.on("student_join_poll", ({ pollId, name }, callback) => {
    const poll = polls[pollId];
    if (!poll) return callback({ success: false, error: "Poll not found" });
    if (!poll.students.includes(name)) poll.students.push(name);
    socket.join(pollId);
    io.to(pollId).emit("student_joined", { name });
    callback({ success: true });
  });

  socket.on("student_submit_answer", ({ pollId, option }, callback) => {
    const poll = polls[pollId];
    if (!poll || !poll.currentQuestion) return callback({ success: false, error: "No active question" });
    poll.answers[option] = (poll.answers[option] || 0) + 1;
    io.to(pollId).emit("results_update", { pollId, results: poll.answers });
    callback({ success: true });
  });

  socket.on("disconnecting", () => {
    for (let room of socket.rooms) {
      if (room !== socket.id && polls[room]) {
        polls[room].students = polls[room].students.filter(name => name !== socket.id);
        io.to(room).emit("student_left", { name: socket.id });
      }
    }
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));



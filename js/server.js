// server.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Seçili koltukları hafızada tutuyoruz
let selectedSeats = [];

io.on("connection", (socket) => {
  console.log("Yeni bir kullanıcı bağlandı:", socket.id);

  // İlk bağlanınca mevcut seçili koltukları gönder
  socket.emit("currentSeats", selectedSeats);

  // Koltuk seçildiğinde
  socket.on("selectSeat", (seatNumber) => {
    if (!selectedSeats.includes(seatNumber)) {
      selectedSeats.push(seatNumber);
      io.emit("seatSelected", seatNumber); // Herkese bildir
    }
  });

  // Koltuk seçimi kaldırıldığında
  socket.on("deselectSeat", (seatNumber) => {
    selectedSeats = selectedSeats.filter((seat) => seat !== seatNumber);
    io.emit("seatDeselected", seatNumber); // Herkese bildir
  });

  // Kullanıcı ayrıldığında
  socket.on("disconnect", () => {
    console.log("Kullanıcı ayrıldı:", socket.id);
  });
});

// Sunucu Başlat
server.listen(5000, () => {
  console.log("Sunucu çalışıyor: http://localhost:5000");
});

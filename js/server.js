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

// Her koltuk kimin tarafından seçildiğini de takip edeceğiz
let seats = {};  // { socketId: [1, 2, 3], socketId2: [4, 5, 6] }
let globalSelectedSeats = {}; // { "1": "socketId1", "2": "socketId2" }

// 🎟️ Dummy Data: Satın alınmış koltuklar (DB'den geliyormuş gibi simüle edildi)
const purchasedSeats = [2, 4, 7, 15, 18, 25]; // Bu koltuklar satın alınmış

// Satın alınmış koltuklar başlangıçta rezerve ediliyor
purchasedSeats.forEach((seatNumber) => {
  globalSelectedSeats[seatNumber] = "purchased";
});

io.on("connection", (socket) => {
  console.log(`Kullanıcı bağlandı: ${socket.id}`);
  seats[socket.id] = [];
  // Yeni bağlanan kullanıcıya mevcut seçili koltuklar ve sahipleri gönderilir
  socket.emit("currentSeats", globalSelectedSeats);

  // Koltuk seçildiğinde
  socket.on("selectSeat", (seatNumber) => {
    if (globalSelectedSeats[seatNumber]) {
      return; // Zaten seçilmişse işlem yapma
    }

    // Koltuk kullanıcıya atanır
    seats[socket.id].push(seatNumber);
    globalSelectedSeats[seatNumber] = socket.id;

    // Tüm kullanıcılara kimin seçtiği bilgisiyle beraber gönderilir
    io.emit("seatSelected", { seatNumber, user: socket.id });
  });

  // Koltuk seçiminden vazgeçildiğinde
  socket.on("deselectSeat", (seatNumber) => {
    if (globalSelectedSeats[seatNumber] === socket.id) {
      seats[socket.id] = seats[socket.id].filter((s) => s !== seatNumber);
      delete globalSelectedSeats[seatNumber];
      io.emit("seatDeselected", { seatNumber, user: socket.id });
    }
  });

  // Kullanıcı bağlantıyı koparırsa
  socket.on("disconnect", () => {
    const userSeats = seats[socket.id] || [];
    userSeats.forEach((seatNumber) => {
      delete globalSelectedSeats[seatNumber];
      io.emit("seatDeselected", { seatNumber, user: socket.id });
    });

    delete seats[socket.id];
  });

  socket.on('timeUp', () => {
    io.emit('timerEnded', { message: "Zaman doldu!" });  // Tüm kullanıcılara mesaj gönder
    const userSeats = seats[socket.id] || [];
    userSeats.forEach((seatNumber) => {
      delete globalSelectedSeats[seatNumber];
      io.emit("seatDeselected", { seatNumber, user: socket.id });
    });

    delete seats[socket.id];
  });
});

// Sunucu Başlat
server.listen(5000, () => {
  console.log("Sunucu çalışıyor: http://localhost:5000");
});

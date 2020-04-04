socketIo = require("socket.io");

class TTT {
  constructor(server) {
    this.io = socketIo(server);
    this.clients = {};

    this.players = {}; // opponent: socket.id of the opponent, symbol = "X" | "O", socket: player's socket
    this.unmatched;
    // When a client-old connects
  }

  onConnection() {
    this.io.on("connection", (socket) => {
      let id = socket.id;

      console.log("New client connected. ID: ", socket.id);
      this.clients[id] = { socket: socket };
      this.onDisconnect(socket);

      this.onPlayerData(socket);

      this.join(socket); // Fill 'players' data structure

      if (this.opponentSocketOf(socket)) {
        this.gameBegin(socket);
      }
    });
  }

  onPlayerData(socket) {
    socket.on("player_data", (data) => {
      console.log("player_data recieved");
      this.clients[socket.id].player_name = data.player_name;
      let o_s = this.opponentSocketOf(socket);
      if (o_s) {
        o_s.emit("get.opponent.name", {
          opponent_name: data.player_name,
        });
      }
    });
  }

  onDisconnect(socket) {
    socket.on("disconnect", () => {
      // Bind event for that socket (player)
      console.log("Client disconnected. ID: ", socket.id);
      delete this.clients[socket.id];
      if (this.unmatched === socket.id) {
        this.unmatched = null;
      }
      socket.broadcast.emit("clientdisconnect", socket.id);
    });
  }

  gameBegin(socket) {
    let opp_socket = this.opponentSocketOf(socket);

    this.sendGameBegin(socket, opp_socket);

    [socket, opp_socket].forEach((s) => {
      this.onMove(s);
      this.gameOnDisconnect(s);
    });
  }

  sendGameBegin(socket, opp_socket) {
    const { clients, players } = this;
    let p_id = socket.id;
    let o_id = opp_socket.id;
    socket.emit("game.begin", {
      symbol: players[p_id].symbol,
      opponent_name: clients[o_id].player_name,
    });

    opp_socket.emit("game.begin", {
      symbol: players[o_id].symbol,
      opponent_name: clients[p_id].player_name,
    });
    console.log(
      clients[p_id].player_name + " vs. " + clients[o_id].player_name
    );
  }

  onMove(socket) {
    socket.on("move.made", (data) => {
      if (!this.opponentSocketOf(socket)) {
        return;
      }
      this.opponentSocketOf(socket).emit("move.made", data); // Emit for the opponent
    });
  }

  gameOnDisconnect(socket) {
    socket.on("disconnect", () => {
      if (this.opponentSocketOf(socket)) {
        this.opponentSocketOf(socket).emit("opponent.left");
      }
    });
  }

  join(socket) {
    // connect to other if possible
    this.players[socket.id] = {
      opponent: this.unmatched,
      symbol: "X",
      socket: socket,
    };

    // If 'unmatched' is defined it contains the socket.id of the player who was waiting for an opponent
    // then, the current socket is player #2
    if (this.unmatched) {
      this.players[socket.id].symbol = "O";
      this.players[this.unmatched].opponent = socket.id;
      this.unmatched = null;
    } else {
      //If 'unmatched' is not define it means the player (current socket) is waiting for an opponent (player #1)
      this.unmatched = socket.id;
    }
  }
  opponentSocketOf(socket) {
    const { players } = this;
    if (!players[socket.id].opponent) {
      return;
    }
    return players[players[socket.id].opponent].socket;
  }
}

module.exports = TTT;

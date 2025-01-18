let socket = null;

export default async function starter() {
    if (!socket) {
        const { io } = await import("https://cdn.jsdelivr.net/npm/socket.io-client@4.6.1/dist/socket.io.min.js");
        socket = io("http://localhost:4000");
        socket.on("connect", () => console.log("Server is connected"));
        socket.on("message", (message) => console.log(message));
        socket.on("disconnect", () => console.log("Server Disconnected"));
    }

    return socket;
}


/*import { io } from "socket.io-client";

let socket = null;

export default function starter() {
    if (!socket) {
        socket = io("http://localhost:4000");
        socket.on("connect", () => console.log("Server is connected"));
        socket.on("message", (message) => console.log(message));
        socket.on("disconnect", () => console.log("Server Disconnected"));
    }

    return socket;
}*/


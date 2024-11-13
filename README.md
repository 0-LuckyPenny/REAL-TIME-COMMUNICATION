# WebRTC-Based Real-Time Communication Project

This project enables real-time communication between users through video and audio calling, chat, and file sharing. It is built with WebRTC, allowing peer-to-peer connections with minimal server involvement, which is used only for signaling during the initial connection setup.

## 📜 Features

1. **Peer-to-Peer Connection**
   - Establishes direct communication between users, making it possible to exchange data without relying on a server after the initial connection is set up.

2. **Room-Based Joining**
   - Users can join specific rooms to connect with other participants in a controlled environment.

3. **Video and Audio Calling**
   - Real-time video and audio calls with toggle functionality to turn on or off video/audio as needed.

4. **Chat Functionality**
   - Text-based messaging within rooms, allowing users to chat alongside video and audio communication.

5. **File Sharing**
   - Direct file transfer between users in the same room for secure, fast file sharing.

## 🗝️ Key Terms
- **WebRTC**: Used for establishing peer-to-peer connections for video, audio, and data transfer without server in middle.
- **Signaling Server**: The server is used solely for signaling purposes to help users find each other and exchange initial connection data (offer, answer, and ICE candidates) Through Socket. Once the connection is established, the server is no longer involved.
- **ICE Candidate**: A network information packet that helps establish a connection between peers. It contains IP addresses and ports that help WebRTC decide the best way to connect to other user.
- **Offer**: The initial proposal sent by one peer to another to start a WebRTC connection. It includes details on supported media formats, connection types, and preferences.
- **Answer**: The response to an offer from the other peer, agreeing to the connection and providing compatible media and connection preferences.
- **SDP (Session Description Protocol)**: A format that describes multimedia communication details, including codecs, formats, network information, and more, which helps configure the WebRTC connection.
- **DataChannel**: A feature of WebRTC that allows direct peer-to-peer data exchange

## 💼 Technologies
- ReactJS
- NodeJS/ExpressJS
- Socket.io
- WebRTC
  
## ⚙️Setup and Installation

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Adityajparmar37/webrtc-project.git
   cd webrtc-project
    ```

2. **Install Dependencies**

    **For Frontend**
    ```
    cd client
    npm intsall
    ```
    **For Backend**
    ```
    cd server
    npm install
    ```

3. **Run Project**

   **For Frontend**
    ```
    cd client
    npm run dev
    ```
    **For Backend**
    ```
    cd server
    npm run start
    ```

## 🧑🏻‍💻 How It Works
- **User joins a room** by entering a room ID.
- **Signaling server initiates connection** setup by exchanging offers, answers, and ICE candidates.
- **Peer-to-peer connection** is established, enabling:
  - Video and audio communication with on/off functionality.
  - Text chat for messages.
  - File sharing for direct file transfer between users.

- **Server disconnection**: Once peers are connected, data flows directly between users without server reliance

class PeerServices {
  constructor(onMessageCallback, onFileReceivedCallback) {
    if (PeerServices.instance) {
      return PeerServices.instance;
    }

    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    this.candidateQueue = [];

    // Chat Data Channel
    const chatChannel = this.peer.createDataChannel("chat");
    chatChannel.onmessage = (e) => onMessageCallback(e.data);
    chatChannel.onopen = () => console.log("Chat channel opened.");
    chatChannel.onclose = () => console.log("Chat channel closed.");
    this.chatChannel = chatChannel;

    // File Data Channel
    const fileChannel = this.peer.createDataChannel("file");
    fileChannel.binaryType = "arraybuffer";
    fileChannel.onmessage = (e) => onFileReceivedCallback(e.data);
    fileChannel.onopen = () => console.log("File channel opened.");
    fileChannel.onclose = () => console.log("File channel closed.");
    this.fileChannel = fileChannel;

    // Incoming Data Channel Handler
    this.peer.ondatachannel = (e) => {
      const { channel } = e;
      if (channel.label === "chat") {
        channel.onmessage = (e) => onMessageCallback(e.data);
        this.chatChannel = channel;
      } else if (channel.label === "file") {
        channel.binaryType = "arraybuffer";
        channel.onmessage = (e) => onFileReceivedCallback(e.data);
        this.fileChannel = channel;
      }
    };

    PeerServices.instance = this;
  }

  sendMessage(message) {
    if (this.chatChannel && this.chatChannel.readyState === "open") {
      this.chatChannel.send(message);
    } else {
      console.log("Chat data channel is not open.");
    }
  }

  sendFile(file) {
    // Step 1: Send metadata first
    const metadata = JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
    });
    this.fileChannel.send(metadata);

    // Step 2: Send file data in chunks
    const chunkSize = 16 * 1024;
    let offset = 0;

    const sendNextChunk = () => {
      if (offset >= file.size) {
        console.log("File transfer complete.");
        return;
      }

      const chunk = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.fileChannel && this.fileChannel.readyState === "open") {
          this.fileChannel.send(e.target.result);
          offset += chunkSize;
          sendNextChunk();
        } else {
          console.log("File data channel is not open.");
        }
      };

      reader.readAsArrayBuffer(chunk);
    };

    if (this.fileChannel && this.fileChannel.readyState === "open") {
      sendNextChunk();
    } else {
      console.log("File data channel is not open for file transfer.");
    }
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(JSON.parse(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);

    this.candidateQueue.forEach((candidate) =>
      this.peer.addIceCandidate(candidate)
    );
    this.candidateQueue = [];

    return JSON.stringify(answer);
  }

  async setLocalDescription(answer) {
    await this.peer.setRemoteDescription(
      new RTCSessionDescription(JSON.parse(answer))
    );
  }

  async getCompleteOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    await new Promise((resolve) => {
      if (this.peer.iceGatheringState === "complete") {
        resolve();
      } else {
        this.peer.onicegatheringstatechange = () => {
          if (this.peer.iceGatheringState === "complete") {
            this.peer.onicegatheringstatechange = null;
            resolve();
          }
        };
      }
    });

    return JSON.stringify(this.peer.localDescription);
  }

  async addIceCandidate(candidate) {
    if (candidate) {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (this.peer.remoteDescription) {
        await this.peer.addIceCandidate(iceCandidate);
      } else {
        this.candidateQueue.push(iceCandidate);
      }
    }
  }
}

export default PeerServices;

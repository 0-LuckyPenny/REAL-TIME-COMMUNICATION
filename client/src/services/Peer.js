class PeerServices {
  constructor() {
    if (!this.peer) {
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

      this.candidateQueue = []; // Queue to store incoming ICE candidates

      // Set up the data channel for chat
      const chatChannel = this.peer.createDataChannel("chat");
      console.log("chat channel created ", chatChannel);
      chatChannel.onmessage = (e) => console.log("Message received: " + e.data);
      chatChannel.onopen = () => console.log("Chat channel opened.");
      chatChannel.onclose = () => console.log("Chat channel closed.");

      // Listen for incoming data channels
      this.peer.ondatachannel = (e) => {
        const receiveChannel = e.channel;
        console.log("rec channel ", receiveChannel);
        receiveChannel.onmessage = (e) =>
          console.log("Message received: " + e.data);
        this.peer.channel = receiveChannel;
      };
    }

    PeerServices.instance = this;
  }

  sendMessage(message) {
    console.log("Send Message this ==> ", this);
    if (this.peer.channel && this.peer.channel.readyState === "open") {
      this.peer.channel.send(message);
    } else {
      // console.log(message)
      console.log("Data channel is not open");
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(JSON.parse(offer));
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);

      // Process any ICE candidates in the queue after setting the remote description
      this.candidateQueue.forEach((candidate) =>
        this.peer.addIceCandidate(candidate)
      );
      this.candidateQueue = []; // Clear the queue after processing

      return JSON.stringify(answer);
    }
  }

  async setLocalDescription(answer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(answer))
      );
    }
  }

  async getCompleteOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await new Promise((resolve) => {
      if (this.peer.iceGatheringState === "complete") {
        resolve();
      } else {
        this.peer.onicegatheringstatechange = () => {
          if (this.peer.iceGatheringState === "complete") {
            this.peer.onicegatheringstatechange = null; // Clean up listener
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
      // Check if remote description is set, otherwise queue the candidate
      if (this.peer.remoteDescription) {
        await this.peer.addIceCandidate(iceCandidate);
      } else {
        this.candidateQueue.push(iceCandidate);
      }
    }
  }
}

export default PeerServices;

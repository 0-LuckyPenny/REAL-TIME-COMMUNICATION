class PeerServices {
  constructor() {
    if (!this.peer) {
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
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(JSON.parse(offer));
      const ans = await this.peer.createAnswer();
      await this.peer.setLocalDescription(new RTCSessionDescription(ans));
      return JSON.stringify(ans);
    }
  }

  async setLocalDescription(ans) {
    if (this.peer) {
      await this.peer.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(ans))
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
      await this.peer.addIceCandidate(candidate);
    }
  }
}

export default new PeerServices();

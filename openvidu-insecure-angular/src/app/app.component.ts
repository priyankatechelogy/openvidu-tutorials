import { OpenVidu, Session, Stream } from 'openvidu-browser';
import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // OpenVidu objects
  OV: OpenVidu;
  session: Session;

  // Streams to feed StreamComponent's
  remoteStreams: Stream[] = [];
  localStream: Stream;

  // Join form
  sessionId: string;
  token: string;

  @Input()
  mainVideoStream: Stream;

  constructor() {
    this.generateParticipantInfo();
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    // On window closed leave session
    this.leaveSession();
  }

  ngOnDestroy() {
    // On component destroyed leave session
    this.leaveSession();
  }

  joinSession() {
    this.OV = new OpenVidu();
    this.session = this.OV.initSession('wss://' + location.hostname + ':8443/' + this.sessionId);

    // 2) Specify the actions when events take place
    this.session.on('streamCreated', (event) => {
      this.remoteStreams.push(event.stream); // Add the new stream to 'remoteStreams' array
      this.session.subscribe(event.stream, ''); // Empty string for no video element
    });

    this.session.on('streamDestroyed', (event) => {
      event.preventDefault(); // Avoid OpenVidu trying to remove the HTML video element
      this.deleteRemoteStream(event.stream); // Remove the stream from 'remoteStreams' array
    });

    // 3) Connect to the session
    this.session.connect(this.token, '{"clientData": "' + this.token + '"}', (error) => {
      // If the connection is successful, initialize a publisher and publish to the session
      if (!error) {

        // 4) Get your own camera stream with the desired resolution
        let publisher = this.OV.initPublisher('', {
          audio: true,
          video: true,
          quality: 'MEDIUM'
        });

        this.localStream = publisher.stream;
        this.mainVideoStream = this.localStream;

        // 5) Publish your stream
        this.session.publish(publisher);

      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });

    return false;
  }

  leaveSession() {
    // Disconnect from session and empty all properties
    if (this.OV) { this.session.disconnect(); };
    this.remoteStreams = [];
    this.localStream = null;
    this.session = null;
    this.OV = null;
    this.generateParticipantInfo();
  }


  private generateParticipantInfo() {
    // Random user nickname and sessionId
    this.sessionId = 'SessionA';
    this.token = 'Participant' + Math.floor(Math.random() * 100);
  }

  private deleteRemoteStream(stream: Stream): void {
    let index = this.remoteStreams.indexOf(stream, 0);
    if (index > -1) {
      this.remoteStreams.splice(index, 1);
    }
  }

  private getMainVideoStream(stream: Stream) {
    this.mainVideoStream = stream;
  }

}

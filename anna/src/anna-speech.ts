import { BrowserSpeechRecognition } from './voice';

export class AnnaSpeechRecognition implements BrowserSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private frameId = 0;
  private silenceStart = 0;
  private hasSpoken = false;

  start() {
    this.audioChunks = [];
    this.hasSpoken = false;
    this.silenceStart = 0;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.stream = stream;
        this.recorder = new MediaRecorder(stream);
        
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        
        const data = new Uint8Array(this.analyser.fftSize);

        const checkVad = () => {
          if (!this.analyser || !this.recorder || this.recorder.state === 'inactive') return;
          this.analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / data.length);

          if (rms > 0.02) {
            this.hasSpoken = true;
            this.silenceStart = 0;
          } else if (this.hasSpoken) {
            if (this.silenceStart === 0) {
              this.silenceStart = performance.now();
            } else if (performance.now() - this.silenceStart > 1500) {
              // 1.5 seconds of silence after speaking -> stop
              this.stop();
              return;
            }
          } else {
             // Not spoken yet, maybe timeout after 10s?
             if (this.silenceStart === 0) this.silenceStart = performance.now();
             else if (performance.now() - this.silenceStart > 10000) {
                 this.stop();
                 return;
             }
          }

          this.frameId = requestAnimationFrame(checkVad);
        };

        this.recorder.ondataavailable = e => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.recorder.onstop = async () => {
          cancelAnimationFrame(this.frameId);
          this.source?.disconnect();
          this.analyser?.disconnect();
          void this.audioContext?.close();
          this.stream?.getTracks().forEach(track => track.stop());

          if (this.audioChunks.length === 0 || !this.hasSpoken) {
            if (this.onend) this.onend();
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const buffer = await audioBlob.arrayBuffer();
          // Convert array buffer to base64 safely
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);

          try {
            const result = await window.anna!.audio.transcribe({ audioBase64: base64, language: this.lang });
            if (this.onresult && result.text) {
              this.onresult({ results: [{ 0: { transcript: result.text } }] });
            }
          } catch (e) {
            if (this.onerror) this.onerror({ error: 'network' });
          } finally {
            if (this.onend) this.onend();
          }
        };

        this.recorder.start();
        this.frameId = requestAnimationFrame(checkVad);
      })
      .catch(err => {
        if (this.onerror) this.onerror({ error: 'not-allowed' });
      });
  }

  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    } else {
      if (this.onend) this.onend();
    }
  }
}

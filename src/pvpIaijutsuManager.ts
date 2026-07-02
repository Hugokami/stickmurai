import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

export type PlayerRole = 'host' | 'client';
export type MatchState = 'lobby' | 'banner' | 'playing' | 'round_end' | 'game_over';
export type TurnDirection = 'left' | 'right'; // Left is P1 (Host), Right is P2 (Client)

export interface PvpStatePacket {
  type: 'state';
  // Position sync (even though players are static, this is useful for basic alignment)
  x: number;
  y: number;
  // State indicators
  chargeProgress: number;
  isParrying: boolean;
  isStaggered: boolean;
  staggerTimer: number;
  isParryCooldown: boolean;
  state?: string;
  dir?: number;
}

export type PvpSubMode = 'classic' | 'sudden_death' | 'hyper_speed' | 'storm_god' | 'insane_survival';

export type PvpMessage =
  | PvpStatePacket
  | { type: 'ping'; sendTime: number }
  | { type: 'pong'; sendTime: number }
  | { type: 'ready_change'; ready: boolean }
  | { type: 'charge_start' }
  | { type: 'charge_cancel' }
  | { type: 'charge_release'; duration: number; speedMultiplier: number; isInstant: boolean }
  | { type: 'parry_success'; isPerfect: boolean }
  | { type: 'hit_taken'; damage: number }
  | { type: 'sync_game_state'; state: MatchState; turn: TurnDirection; p1Lives: number; p2Lives: number; round: number; rallyCount: number; subMode?: PvpSubMode; p1Kills?: number; p2Kills?: number; timeRemaining?: number }
  | { type: 'rematch_request' }
  | { type: 'rematch_accept' }
  | { type: 'lightning_strike'; target: 'left' | 'right' }
  | { type: 'name_exchange'; displayName: string }
  | { type: 'emote'; id: number }
  | { type: 'sub_mode_sync'; subMode: PvpSubMode }
  | { type: 'pvp_enemy_spawn'; id: string; subType: string; x: number; y: number }
  | { type: 'pvp_enemy_sync'; list: { id: string; x: number; y: number; hp: number; state: string; dir: number }[] }
  | { type: 'pvp_enemy_hit'; id: string; damage: number }
  | { type: 'pvp_lives_sync'; p1Lives: number; p2Lives: number };

class PvpIaijutsuManager {
  public peer: Peer | null = null;
  public conn: DataConnection | null = null;
  public role: PlayerRole | null = null;
  public roomCode = '';
  
  public isConnected = false;
  public localReady = false;
  public remoteReady = false;
  
  // Game state
  public matchState: MatchState = 'lobby';
  public currentTurn: TurnDirection = 'left'; // Host always starts first
  public roundStartTurn: TurnDirection = 'left';
  public subMode: PvpSubMode = 'classic';
  public p1Lives = 3;
  public p2Lives = 3;
  public round = 1;
  public rallyCount = 0;
  
  public p1Name = 'Player 1';
  public p2Name = 'Player 2';
  
  // Latency monitoring
  public ping = 0;
  private pingInterval: any = null;
  
  // Opponent remote state packet buffer
  public remoteState: PvpStatePacket = {
    type: 'state',
    x: 0,
    y: 0,
    chargeProgress: 0,
    isParrying: false,
    isStaggered: false,
    staggerTimer: 0,
    isParryCooldown: false
  };

  // Callback hooks for UI updates
  public onConnectionOpened: (() => void) | null = null;
  public onConnectionClosed: (() => void) | null = null;
  public onReadyStateChanged: (() => void) | null = null;
  public onMessageReceived: ((msg: PvpMessage) => void) | null = null;
  public onPingUpdated: ((ping: number) => void) | null = null;

  constructor() {}

  /**
   * Initializes a PeerJS node as a Host and generates an invite code.
   */
  public hostMatch(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.role = 'host';
      this.localReady = false;
      this.remoteReady = false;
      this.isConnected = false;
      this.resetMatchData();

      // Generate a short 5-letter invite code using custom prefix
      const code = 'STICK-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      this.roomCode = code;

      // Timeout check if broker server connection fails
      const timeout = setTimeout(() => {
        if (!this.peer || !this.peer.open) {
          this.disconnect();
          reject(new Error('Hosting timed out. PeerJS broker server is unreachable.'));
        }
      }, 12000);

      // We use PeerJS cloud service for connection brokerage
      this.peer = new Peer(code, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        clearTimeout(timeout);
        console.log('Peer Host opened with ID:', id);
        resolve(id);
      });

      this.peer.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Peer Host encountered error:', err);
        this.disconnect();
        reject(err);
      });

      this.peer.on('connection', (connection) => {
        console.log('Client attempting to connect:', connection.peer);
        this.conn = connection;
        this.setupConnectionHandlers();
      });
    });
  }

  /**
   * Connects to a Host PeerJS node using the provided invite code.
   */
  public joinMatch(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.role = 'client';
      this.localReady = false;
      this.remoteReady = false;
      this.isConnected = false;
      this.resetMatchData();
      this.roomCode = code;

      // Timeout check if connecting to PeerJS broker or host fails entirely
      const timeout = setTimeout(() => {
        if (!this.isConnected) {
          this.disconnect();
          reject(new Error('Connection timed out. Invite code might be incorrect or host is offline.'));
        }
      }, 12000);

      // Generate a random client peer ID to avoid collision
      const clientPeerId = 'CLIENT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      this.peer = new Peer(clientPeerId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        console.log('Peer Client opened. Connecting to host:', code);
        this.conn = this.peer!.connect(code, {
          reliable: true // we need TCP-like reliable messages for key inputs and turns
        });

        // Setup handlers when connection is initiated
        this.setupConnectionHandlers();

        // Resolve connection promise when open event triggers
        const handleOpenResolve = () => {
          clearTimeout(timeout);
          resolve();
        };

        const rawChannel = (this.conn as any).dataChannel;
        const isChannelOpen = this.conn.open || (rawChannel && rawChannel.readyState === 'open');

        if (isChannelOpen) {
          handleOpenResolve();
        } else {
          this.conn.on('open', handleOpenResolve);
          if (rawChannel) {
            rawChannel.addEventListener('open', handleOpenResolve);
          }
        }
      });

      this.peer.on('error', (err) => {
        console.error('Peer Client encountered error:', err);
        clearTimeout(timeout);
        this.disconnect();
        reject(err);
      });
    });
  }

  private setupConnectionHandlers() {
    if (!this.conn) return;

    const handleOpen = () => {
      if (this.isConnected) return;
      console.log('Data Connection opened successfully with peer:', this.conn!.peer);
      this.isConnected = true;
      
      // Start Latency Monitoring
      this.startPingInterval();

      if (this.onConnectionOpened) {
        this.onConnectionOpened();
      }
    };

    // Access the raw data channel if available to check readyState (fixes PeerJS race condition where conn.open is false but dataChannel is open)
    const rawChannel = (this.conn as any).dataChannel;
    const isChannelOpen = this.conn.open || (rawChannel && rawChannel.readyState === 'open');

    if (isChannelOpen) {
      setTimeout(handleOpen, 0);
    } else {
      this.conn.on('open', handleOpen);
      if (rawChannel) {
        rawChannel.addEventListener('open', handleOpen);
      }
    }

    this.conn.on('data', (data: any) => {
      const msg = data as PvpMessage;
      
      if (msg.type === 'state') {
        this.remoteState = msg;
        return;
      }

      this.handleProtocolMessage(msg);
    });

    this.conn.on('close', () => {
      console.log('Connection closed by remote peer.');
      this.handleDisconnect();
    });

    this.conn.on('error', (err) => {
      console.error('Data Connection encountered error:', err);
      this.handleDisconnect();
    });
  }

  private handleProtocolMessage(msg: PvpMessage) {
    switch (msg.type) {
      case 'ping':
        this.send({ type: 'pong', sendTime: msg.sendTime });
        break;

      case 'pong':
        this.ping = Date.now() - msg.sendTime;
        if (this.onPingUpdated) {
          this.onPingUpdated(this.ping);
        }
        break;

      case 'ready_change':
        this.remoteReady = msg.ready;
        if (this.onReadyStateChanged) {
          this.onReadyStateChanged();
        }
        break;

      case 'sync_game_state':
        // Synchronize round state parameters from host authority
        if (this.role === 'client') {
          this.matchState = msg.state;
          this.currentTurn = msg.turn;
          this.p1Lives = msg.p1Lives;
          this.p2Lives = msg.p2Lives;
          this.round = msg.round;
          this.rallyCount = msg.rallyCount;
          if (msg.subMode) this.subMode = msg.subMode;
        }
        break;

      case 'name_exchange':
        if (this.role === 'host') {
          this.p2Name = msg.displayName;
        } else {
          this.p1Name = msg.displayName;
        }
        if (this.onReadyStateChanged) {
          this.onReadyStateChanged();
        }
        break;

      case 'sub_mode_sync':
        this.subMode = msg.subMode;
        break;

      case 'pvp_lives_sync':
        this.p1Lives = msg.p1Lives;
        this.p2Lives = msg.p2Lives;
        break;
    }

    if (this.onMessageReceived) {
      this.onMessageReceived(msg);
    }
  }

  /**
   * Broadcasts a message packet to the connected peer.
   */
  public send(msg: PvpMessage) {
    if (this.conn) {
      const rawChannel = (this.conn as any).dataChannel;
      const isChannelOpen = this.conn.open || (rawChannel && rawChannel.readyState === 'open');
      if (isChannelOpen) {
        try {
          this.conn.send(msg);
        } catch (e) {
          console.error("Failed to send WebRTC data packet:", e);
        }
      }
    }
  }

  /**
   * Sends local player physics/input state updates (Unreliable/High Frequency)
   */
  public sendState(state: Omit<PvpStatePacket, 'type'>) {
    this.send({
      type: 'state',
      ...state
    });
  }

  public setReady(ready: boolean) {
    this.localReady = ready;
    this.send({ type: 'ready_change', ready });
    if (this.onReadyStateChanged) {
      this.onReadyStateChanged();
    }
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', sendTime: Date.now() });
    }, 2000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect() {
    this.handleDisconnect();
  }

  private handleDisconnect() {
    this.stopPingInterval();
    
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.isConnected) {
      this.isConnected = false;
      if (this.onConnectionClosed) {
        this.onConnectionClosed();
      }
    }
  }

  private resetMatchData() {
    this.matchState = 'lobby';
    this.currentTurn = 'left';
    this.roundStartTurn = 'left';
    this.subMode = 'classic';
    this.p1Lives = 3;
    this.p2Lives = 3;
    this.round = 1;
    this.rallyCount = 0;
    this.ping = 0;
  }
}

export const pvpManager = new PvpIaijutsuManager();

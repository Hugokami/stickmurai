import { pvpManager } from './pvpIaijutsuManager';
import { supabase } from './supabaseClient';
import { globals } from './globals';
import { pauseBgm } from './audio';

let userUid: string | null = null;
let userProfile: any = null;
let friends: any[] = [];
let invitesChannel: any = null;
let alertsChannel: any = null;
let friendsSubscription: any = null;
let heartbeatInterval: any = null;
let activeIncomingInviteId: string | null = null;
let activeIncomingInviteSenderPeerId: string | null = null;

// Helper to determine if a profile's heartbeat is fresh
const isFriendOnline = (friend: any) => {
  if (friend.status === 'offline') return false;
  const lastSeenDate = new Date(friend.last_seen);
  const diffMs = Math.abs(Date.now() - lastSeenDate.getTime());
  return diffMs < 120000; // 2 minutes threshold to robustly handle clock drifts
};

async function updatePresence(status: string, extraFields: Record<string, any> = {}) {
  if (!userUid) return;
  try {
    await supabase
      .from('profiles')
      .update({
        status: status,
        last_seen: new Date().toISOString(),
        ...extraFields
      })
      .eq('id', userUid);
  } catch (e) {
    console.error('Failed to update presence status:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (userUid) {
      supabase.from('profiles').update({ status: 'offline', queue_mode: null, peer_id: null }).eq('id', userUid);
    }
  });
}

export function initPvPLobby(onStartMatch: () => void) {
  // Main Menu Hook
  const pvpModeBtn = document.getElementById('pvp-mode-btn');
  const mainMenu = document.getElementById('main-menu');
  const pvpLobbyScreen = document.getElementById('pvp-lobby-screen');

  // Steps Panels
  const stepSelect = document.getElementById('pvp-step-select');
  const stepReady = document.getElementById('pvp-step-ready');

  // Buttons & Displays
  const cancelBtn = document.getElementById('pvp-cancel-btn');
  const readyBtn = document.getElementById('pvp-ready-btn');
  const readyLeaveBtn = document.getElementById('pvp-ready-leave-btn');
  const p1Status = document.getElementById('pvp-p1-status');
  const p2Status = document.getElementById('pvp-p2-status');
  const pingDisplay = document.getElementById('pvp-ping-display');

  // Profile Form Elements
  const nameInput = document.getElementById('pvp-name-input') as HTMLInputElement;
  const nameSaveBtn = document.getElementById('pvp-name-save-btn');
  const uidDisplay = document.getElementById('pvp-uid-display');
  const uidCopyBtn = document.getElementById('pvp-uid-copy-btn');

  // Add Friend Elements
  const friendUidInput = document.getElementById('pvp-friend-uid-input') as HTMLInputElement;
  const addFriendBtn = document.getElementById('pvp-add-friend-btn');

  // Invite Modal Elements
  const invitePopup = document.getElementById('pvp-invite-popup');
  const inviteAcceptBtn = document.getElementById('pvp-invite-accept-btn');
  const inviteDeclineBtn = document.getElementById('pvp-invite-decline-btn');

  const showStep = (step: 'select' | 'ready') => {
    if (stepSelect) stepSelect.style.display = step === 'select' ? 'flex' : 'none';
    if (stepReady) stepReady.style.display = step === 'ready' ? 'flex' : 'none';
  };

  // 1. Enter PvP Lobby from Main Menu
  if (pvpModeBtn) {
    pvpModeBtn.addEventListener('click', async () => {
      if (mainMenu) mainMenu.style.display = 'none';
      if (pvpLobbyScreen) pvpLobbyScreen.style.display = 'flex';
      showStep('select');
      
      if (!userUid) {
        await initSupabaseAuth();
      } else {
        await loadProfile();
        await loadFriends();
        updatePresence('online');
      }
    });
  }

  // Back to main menu
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      pvpManager.disconnect();
      if (pvpLobbyScreen) pvpLobbyScreen.style.display = 'none';
      if (mainMenu) mainMenu.style.display = 'flex';
    });
  }

  // Copy UID to clipboard
  if (uidCopyBtn) {
    uidCopyBtn.addEventListener('click', () => {
      if (userProfile && userProfile.short_id) {
        navigator.clipboard.writeText(userProfile.short_id.toString());
        alert('Your UID has been copied to clipboard!');
      }
    });
  }

  // Save Display Name
  if (nameSaveBtn) {
    nameSaveBtn.addEventListener('click', async () => {
      const newName = nameInput?.value.trim();
      if (newName) {
        await saveProfileName(newName);
      }
    });
  }

  // Add Friend
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', async () => {
      const friendUid = friendUidInput?.value.trim();
      if (friendUid) {
        await addFriend(friendUid);
        if (friendUidInput) friendUidInput.value = '';
      }
    });
  }

  // Invite Modal Buttons
  if (inviteAcceptBtn) {
    inviteAcceptBtn.addEventListener('click', async () => {
      if (!activeIncomingInviteId || !activeIncomingInviteSenderPeerId) return;
      
      const inviteId = activeIncomingInviteId;
      const peerId = activeIncomingInviteSenderPeerId;
      
      if (invitePopup) invitePopup.style.display = 'none';
      
      activeIncomingInviteId = null;
      activeIncomingInviteSenderPeerId = null;
      
      try {
        await updatePresence('busy');
        
        // Accept invitation in db
        await supabase
          .from('invites')
          .update({ status: 'accepted' })
          .eq('id', inviteId);
          
        // Hide standard single player/main menu screens/HUDs if open
        const mainMenuEl = document.getElementById('main-menu');
        if (mainMenuEl) mainMenuEl.style.display = 'none';
        const pvpLobbyScreenEl = document.getElementById('pvp-lobby-screen');
        if (pvpLobbyScreenEl) pvpLobbyScreenEl.style.display = 'flex';
        
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.style.display = 'none';
        const skillSelectScreen = document.getElementById('skill-select-screen');
        if (skillSelectScreen) skillSelectScreen.style.display = 'none';
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.style.display = 'none';
        const settingsScreen = document.getElementById('settings-screen');
        if (settingsScreen) settingsScreen.style.display = 'none';
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) mobileControls.style.display = 'none';
        
        // Stop any running BGM and reset game state to mainmenu
        globals.gameState = 'mainmenu';
        pauseBgm();

        showStep('ready');
        await pvpManager.joinMatch(peerId);
      } catch (err: any) {
        alert('Failed to connect: ' + err.message);
        await updatePresence('online');
      }
    });
  }

  if (inviteDeclineBtn) {
    inviteDeclineBtn.addEventListener('click', async () => {
      if (!activeIncomingInviteId) return;
      
      const inviteId = activeIncomingInviteId;
      if (invitePopup) invitePopup.style.display = 'none';
      
      activeIncomingInviteId = null;
      activeIncomingInviteSenderPeerId = null;
      
      await supabase
        .from('invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);
    });
  }

  // 4. Ready Up Panel
  if (readyBtn) {
    readyBtn.addEventListener('click', () => {
      const currentReady = pvpManager.localReady;
      pvpManager.setReady(!currentReady);
    });
  }

  if (readyLeaveBtn) {
    readyLeaveBtn.addEventListener('click', async () => {
      pvpManager.disconnect();
      showStep('select');
      await updatePresence('online');
    });
  }

  // Network Event Subscriptions
  function getModeDisplayName(mode: string): string {
    switch (mode) {
      case 'classic': return 'CLASSIC DUEL (3 Lives)';
      case 'sudden_death': return 'SUDDEN DEATH (1 Life)';
      case 'hyper_speed': return 'HYPER SPEED (3 Lives)';
      case 'storm_god': return 'STORM GOD (3 Lives)';
      case 'insane_survival': return 'INSANE CO-OP SURVIVAL';
      default: return (mode || '').toUpperCase();
    }
  }

  pvpManager.onConnectionOpened = () => {
    if (queueInterval) {
      clearInterval(queueInterval);
      queueInterval = null;
    }
    const findBtn = document.getElementById('pvp-find-match-btn');
    const queueStatus = document.getElementById('pvp-queue-status');
    if (findBtn) {
      findBtn.innerText = 'Find Match';
      findBtn.style.borderColor = '#10b981';
    }
    if (queueStatus) queueStatus.style.display = 'none';

    showStep('ready');
    updateReadyStatusDisplay();
    
    // Update Ready Room display
    const readyModeDisplay = document.getElementById('pvp-ready-mode-display');
    if (readyModeDisplay) {
      readyModeDisplay.innerText = `MODE: ${getModeDisplayName(pvpManager.subMode)}`;
    }
    
    // Exchange names!
    if (userProfile && userProfile.display_name) {
      pvpManager.send({
        type: 'name_exchange',
        displayName: userProfile.display_name
      });
      if (pvpManager.role === 'host') {
        pvpManager.p1Name = userProfile.display_name;
      } else {
        pvpManager.p2Name = userProfile.display_name;
      }
    }

    // Host syncs the selected mode to client immediately
    if (pvpManager.role === 'host') {
      pvpManager.send({
        type: 'sub_mode_sync',
        subMode: pvpManager.subMode
      });
    }
  };

  pvpManager.onConnectionClosed = async () => {
    if (pvpManager.matchState !== 'lobby') {
      alert('Opponent disconnected. Returning to main menu.');
      window.location.reload(); 
    } else {
      alert('Connection closed by remote peer.');
      showStep('select');
      await updatePresence('online');
    }
  };

  pvpManager.onReadyStateChanged = () => {
    updateReadyStatusDisplay();
    
    // Check if both players are ready
    if (pvpManager.localReady && pvpManager.remoteReady) {
      if (pvpManager.role === 'host') {
        pvpManager.matchState = 'banner';
        pvpManager.currentTurn = Math.random() < 0.5 ? 'left' : 'right';
        pvpManager.roundStartTurn = pvpManager.currentTurn;
        if (pvpManager.subMode === 'insane_survival') {
          pvpManager.p1Lives = 5;
          pvpManager.p2Lives = 5;
        } else {
          pvpManager.p1Lives = pvpManager.subMode === 'sudden_death' ? 1 : 3;
          pvpManager.p2Lives = pvpManager.subMode === 'sudden_death' ? 1 : 3;
        }
        pvpManager.round = 1;
        pvpManager.rallyCount = 0;

        pvpManager.send({
          type: 'sync_game_state',
          state: 'banner',
          turn: pvpManager.currentTurn,
          p1Lives: pvpManager.p1Lives,
          p2Lives: pvpManager.p2Lives,
          round: pvpManager.round,
          rallyCount: pvpManager.rallyCount,
          subMode: pvpManager.subMode
        });

        if (pvpLobbyScreen) pvpLobbyScreen.style.display = 'none';
        onStartMatch();
      }
    }
  };

  pvpManager.onPingUpdated = (ping) => {
    if (pingDisplay) {
      pingDisplay.innerText = `Ping: ${ping} ms`;
    }
  };

  pvpManager.onMessageReceived = (msg) => {
    if (msg.type === 'sub_mode_sync') {
      const readyModeDisplay = document.getElementById('pvp-ready-mode-display');
      if (readyModeDisplay) {
        readyModeDisplay.innerText = `MODE: ${getModeDisplayName(msg.subMode)}`;
      }
    }
    if (msg.type === 'sync_game_state' && pvpManager.role === 'client') {
      if (pvpLobbyScreen) pvpLobbyScreen.style.display = 'none';
      onStartMatch();
    }
  };

  function updateReadyStatusDisplay() {
    const isHost = pvpManager.role === 'host';
    const localReady = pvpManager.localReady;
    const remoteReady = pvpManager.remoteReady;

    const p1Ready = isHost ? localReady : remoteReady;
    const p2Ready = isHost ? remoteReady : localReady;

    if (p1Status) {
      p1Status.innerText = p1Ready ? 'READY' : 'WAITING';
      p1Status.className = 'pvp-status-badge ' + (p1Ready ? 'ready' : 'waiting');
    }
    if (p2Status) {
      p2Status.innerText = p2Ready ? 'READY' : 'WAITING';
      p2Status.className = 'pvp-status-badge ' + (p2Ready ? 'ready' : 'waiting');
    }

    if (readyBtn) {
      readyBtn.innerText = localReady ? 'Cancel Ready' : 'Ready Up';
      readyBtn.style.borderColor = localReady ? '#ff3355' : '#10b981';
    }
  }

  // --- Supabase Social Integration Internals ---

  async function initSupabaseAuth() {
    const authStatusEl = document.getElementById('pvp-auth-status');
    try {
      let { data: { session } } = await supabase.auth.getSession();
      
      // Verify session profile validity
      if (session && session.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data) {
          userUid = session.user.id;
          userProfile = data;
        } else {
          console.warn('Session user profile invalid or missing in DB. Signing out to recreate:', error);
          await supabase.auth.signOut();
          session = null;
          userUid = null;
          userProfile = null;
        }
      }
      
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
        if (session && session.user) {
          userUid = session.user.id;
          // Query profile (trigger handles creation instantly)
          const { data: pData, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userUid)
            .single();
            
          if (pErr) throw pErr;
          userProfile = pData;
        }
      }
      
      if (session && session.user && userProfile) {
        if (authStatusEl) {
          authStatusEl.textContent = 'ONLINE';
          authStatusEl.style.color = '#10b981';
        }
        
        if (nameInput) nameInput.value = userProfile.display_name;
        if (uidDisplay) uidDisplay.textContent = `UID: ${userProfile.short_id}`;
        
        setupPresenceHeartbeat();
        await loadFriends();
        subscribeToInvites();
        subscribeToFriendsPresence();
        subscribeToFriendships();
      }
    } catch (err: any) {
      console.error('Supabase Auth failed:', err);
      if (authStatusEl) {
        authStatusEl.textContent = 'ERROR';
        authStatusEl.style.color = '#ef4444';
      }
    }
  }

  async function loadProfile() {
    if (!userUid) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userUid).single();
    if (error) {
      console.warn('Profile fetch warning:', error);
      return;
    }
    userProfile = data;
    
    if (nameInput) nameInput.value = userProfile.display_name;
    if (uidDisplay) uidDisplay.textContent = `UID: ${userProfile.short_id}`;
  }

  async function saveProfileName(newName: string) {
    if (!userUid || !newName.trim()) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName.trim() })
      .eq('id', userUid);
    if (error) {
      alert('Failed to update display name: ' + error.message);
    } else {
      alert('Profile name updated successfully!');
      await loadProfile();
    }
  }

  function setupPresenceHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    updatePresence('online');
    heartbeatInterval = setInterval(() => {
      updatePresence('online');
    }, 10000);
  }

  let friendshipsSubscription: any = null;

  async function loadFriends() {
    if (!userUid) return;
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${userUid},friend_id.eq.${userUid}`);
      
    if (error) {
      console.error('Failed to load friends:', error);
      return;
    }
    
    const fetchedFriends = [];
    const fetchedRequests = [];
    
    for (const row of data) {
      const friendId = row.user_id === userUid ? row.friend_id : row.user_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single();
        
      if (profile) {
        const friendObj = { ...row, profile };
        if (row.status === 'accepted') {
          fetchedFriends.push(friendObj);
        } else if (row.status === 'pending') {
          // If we are the friend_id, it is an incoming request for us to accept
          if (row.friend_id === userUid) {
            fetchedRequests.push(friendObj);
          }
        }
      }
    }
    
    friends = fetchedFriends;
    renderFriendsList();
    renderRequestsList(fetchedRequests);
    
    const requestsTab = document.getElementById('pvp-tab-requests');
    if (requestsTab) {
      requestsTab.textContent = `Requests (${fetchedRequests.length})`;
    }
  }

  function renderFriendsList() {
    const container = document.getElementById('pvp-friends-container');
    if (!container) return;
    
    if (friends.length === 0) {
      container.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 20px;">No friends added yet. Share your UID!</div>`;
      return;
    }
    
    container.innerHTML = '';
    
    for (const friendship of friends) {
      const friendProfile = friendship.profile;
      if (!friendProfile) continue;
      
      const online = isFriendOnline(friendProfile);
      const statusText = online ? (friendProfile.status === 'busy' ? 'In-Game' : 'Online') : 'Offline';
      const statusColor = online ? (friendProfile.status === 'busy' ? '#ef4444' : '#10b981') : '#6b7280';
      const statusDot = online ? (friendProfile.status === 'busy' ? '🔴' : '🟢') : '⚫';
      
      const friendRow = document.createElement('div');
      friendRow.style.display = 'flex';
      friendRow.style.justifyContent = 'space-between';
      friendRow.style.alignItems = 'center';
      friendRow.style.background = 'rgba(255,255,255,0.03)';
      friendRow.style.padding = '8px 12px';
      friendRow.style.borderRadius = '6px';
      friendRow.style.border = '1px solid rgba(255,255,255,0.05)';
      
      const nameCol = document.createElement('div');
      nameCol.style.display = 'flex';
      nameCol.style.flexDirection = 'column';
      nameCol.style.gap = '2px';
      nameCol.style.textAlign = 'left';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = friendProfile.display_name;
      nameSpan.style.color = '#fff';
      nameSpan.style.fontSize = '13px';
      nameSpan.style.fontFamily = 'Orbitron';
      
      const statusSpan = document.createElement('span');
      statusSpan.textContent = `${statusDot} ${statusText}`;
      statusSpan.style.color = statusColor;
      statusSpan.style.fontSize = '10px';
      statusSpan.style.fontFamily = 'monospace';
      
      nameCol.appendChild(nameSpan);
      nameCol.appendChild(statusSpan);
      
      const actionsCol = document.createElement('div');
      actionsCol.style.display = 'flex';
      actionsCol.style.gap = '8px';
      actionsCol.style.alignItems = 'center';
      
      // Invite button
      const inviteBtn = document.createElement('button');
      inviteBtn.textContent = 'Invite';
      inviteBtn.style.padding = '4px 10px';
      inviteBtn.style.fontSize = '11px';
      inviteBtn.style.borderRadius = '4px';
      inviteBtn.style.cursor = 'pointer';
      inviteBtn.style.fontFamily = 'Orbitron';
      
      if (online && friendProfile.status === 'online') {
        inviteBtn.style.background = 'transparent';
        inviteBtn.style.border = '1px solid #f59e0b';
        inviteBtn.style.color = '#f59e0b';
        inviteBtn.addEventListener('click', () => sendInvite(friendProfile.id));
      } else {
        inviteBtn.style.background = 'transparent';
        inviteBtn.style.border = '1px solid rgba(255,255,255,0.1)';
        inviteBtn.style.color = 'rgba(255,255,255,0.2)';
        inviteBtn.disabled = true;
      }
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.style.background = 'none';
      deleteBtn.style.border = 'none';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.padding = '4px';
      deleteBtn.addEventListener('click', () => removeFriend(friendProfile.id));
      
      actionsCol.appendChild(inviteBtn);
      actionsCol.appendChild(deleteBtn);
      
      friendRow.appendChild(nameCol);
      friendRow.appendChild(actionsCol);
      
      container.appendChild(friendRow);
    }
  }

  function renderRequestsList(requests: any[]) {
    const container = document.getElementById('pvp-requests-container');
    if (!container) return;
    
    if (requests.length === 0) {
      container.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 20px;">No pending requests.</div>`;
      return;
    }
    
    container.innerHTML = '';
    
    for (const req of requests) {
      const friendProfile = req.profile;
      if (!friendProfile) continue;
      
      const reqRow = document.createElement('div');
      reqRow.style.display = 'flex';
      reqRow.style.justifyContent = 'space-between';
      reqRow.style.alignItems = 'center';
      reqRow.style.background = 'rgba(255,255,255,0.03)';
      reqRow.style.padding = '8px 12px';
      reqRow.style.borderRadius = '6px';
      reqRow.style.border = '1px solid rgba(255,255,255,0.05)';
      
      const infoCol = document.createElement('div');
      infoCol.style.display = 'flex';
      infoCol.style.flexDirection = 'column';
      infoCol.style.gap = '2px';
      infoCol.style.textAlign = 'left';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = friendProfile.display_name;
      nameSpan.style.color = '#fff';
      nameSpan.style.fontSize = '13px';
      nameSpan.style.fontFamily = 'Orbitron';
      
      const uidSpan = document.createElement('span');
      uidSpan.textContent = `UID: ${friendProfile.short_id}`;
      uidSpan.style.color = 'rgba(255,255,255,0.4)';
      uidSpan.style.fontSize = '10px';
      uidSpan.style.fontFamily = 'monospace';
      
      infoCol.appendChild(nameSpan);
      infoCol.appendChild(uidSpan);
      
      const actionsCol = document.createElement('div');
      actionsCol.style.display = 'flex';
      actionsCol.style.gap = '8px';
      
      const acceptBtn = document.createElement('button');
      acceptBtn.textContent = 'Accept';
      acceptBtn.style.padding = '4px 10px';
      acceptBtn.style.fontSize = '11px';
      acceptBtn.style.borderRadius = '4px';
      acceptBtn.style.cursor = 'pointer';
      acceptBtn.style.fontFamily = 'Orbitron';
      acceptBtn.style.background = 'transparent';
      acceptBtn.style.border = '1px solid #10b981';
      acceptBtn.style.color = '#10b981';
      acceptBtn.addEventListener('click', () => acceptFriendRequest(req.user_id));
      
      const declineBtn = document.createElement('button');
      declineBtn.textContent = 'Decline';
      declineBtn.style.padding = '4px 10px';
      declineBtn.style.fontSize = '11px';
      declineBtn.style.borderRadius = '4px';
      declineBtn.style.cursor = 'pointer';
      declineBtn.style.fontFamily = 'Orbitron';
      declineBtn.style.background = 'transparent';
      declineBtn.style.border = '1px solid #ef4444';
      declineBtn.style.color = '#ef4444';
      declineBtn.addEventListener('click', () => declineFriendRequest(req.user_id));
      
      actionsCol.appendChild(acceptBtn);
      actionsCol.appendChild(declineBtn);
      
      reqRow.appendChild(infoCol);
      reqRow.appendChild(actionsCol);
      
      container.appendChild(reqRow);
    }
  }

  async function acceptFriendRequest(senderId: string) {
    if (!userUid) return;
    try {
      const { error: updateErr } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', senderId)
        .eq('friend_id', userUid);
        
      if (updateErr) throw updateErr;
      
      alert('Friend request accepted!');
      await loadFriends();
    } catch (err: any) {
      alert('Failed to accept request: ' + err.message);
    }
  }

  async function declineFriendRequest(senderId: string) {
    if (!userUid) return;
    try {
      const { error: deleteErr } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', senderId)
        .eq('friend_id', userUid);
        
      if (deleteErr) throw deleteErr;
      
      alert('Friend request declined.');
      await loadFriends();
    } catch (err: any) {
      alert('Failed to decline request: ' + err.message);
    }
  }

  async function addFriend(friendUid: string) {
    if (!userUid) return;
    const targetShortId = parseInt(friendUid.trim(), 10);
    
    if (isNaN(targetShortId)) {
      alert('Please enter a valid 8-digit numeric UID.');
      return;
    }
    if (userProfile && targetShortId === userProfile.short_id) {
      alert('You cannot add yourself as a friend.');
      return;
    }
    
    // Check if user exists by short_id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('short_id', targetShortId)
      .single();
      
    if (error || !profile) {
      alert('Ronin UID not found.');
      return;
    }
    
    // Check if already friends
    const exists = friends.some(f => f.profile && f.profile.id === profile.id);
    if (exists) {
      alert('You are already friends with this Ronin.');
      return;
    }
    
    // Add friendship record using UUIDs
    const { error: insertErr } = await supabase
      .from('friendships')
      .insert({
        user_id: userUid,
        friend_id: profile.id,
        status: 'pending'
      });
      
    if (insertErr) {
      alert('Failed to add friend: ' + insertErr.message);
    } else {
      alert(`Friend request sent to ${profile.display_name}!`);
      await loadFriends();
    }
  }

  async function removeFriend(friendUid: string) {
    if (!userUid) return;
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userUid},friend_id.eq.${friendUid}),and(user_id.eq.${friendUid},friend_id.eq.${userUid})`);
      
    if (error) {
      alert('Failed to remove friend: ' + error.message);
    } else {
      alert('Friend removed successfully.');
      await loadFriends();
    }
  }

  async function sendInvite(friendUid: string) {
    const dropdown = document.getElementById('pvp-mode-select-dropdown') as HTMLSelectElement;
    if (dropdown) {
      pvpManager.subMode = dropdown.value as any;
    }
    
    // Show waiting UI
    const container = document.getElementById('pvp-friends-container');
    let waitingInfo = document.getElementById('pvp-invite-waiting');
    if (!waitingInfo && container) {
      waitingInfo = document.createElement('div');
      waitingInfo.id = 'pvp-invite-waiting';
      waitingInfo.style.color = '#f59e0b';
      waitingInfo.style.fontSize = '12px';
      waitingInfo.style.fontFamily = 'Orbitron';
      waitingInfo.style.textAlign = 'center';
      waitingInfo.style.margin = '10px 0';
      waitingInfo.textContent = 'CONNECTING SIGNALING...';
      container.parentElement?.insertBefore(waitingInfo, container);
    }
    
    try {
      const peerId = await pvpManager.hostMatch();
      
      if (waitingInfo) {
        waitingInfo.textContent = 'WAITING FOR OPPONENT...';
      }
      
      const { data: invite, error } = await supabase
        .from('invites')
        .insert({
          sender_id: userUid,
          receiver_id: friendUid,
          sender_peer_id: peerId,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      await updatePresence('busy');
      
      // INSTANT BROADCAST SEND
      const senderName = userProfile?.display_name || 'Ronin';
      const sendChannel = supabase.channel(`alerts:${friendUid}`);
      console.log(`[Invites] Sending broadcast to Alerts channel alerts:${friendUid}...`);
      sendChannel.subscribe((status, err) => {
        console.log(`[Invites] Broadcast channel alerts:${friendUid} status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          sendChannel.send({
            type: 'broadcast',
            event: 'invite',
            payload: {
              id: invite.id,
              sender_id: userUid,
              sender_name: senderName,
              sender_peer_id: peerId
            }
          }).then((res) => {
            console.log(`[Invites] Broadcast invite sent successfully to alerts:${friendUid}:`, res);
          }).catch((sendErr) => {
            console.error(`[Invites] Broadcast invite failed to send:`, sendErr);
          });
          // Cleanup this temporary channel after a short delay
          setTimeout(() => {
            supabase.removeChannel(sendChannel);
          }, 3000);
        }
      });

      // DB changes subscription for status updates (accept/decline) - Filterless
      const inviteChannel = supabase
        .channel(`invite_${invite.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'invites'
        }, async (payload: any) => {
          const updated = payload.new;
          if (updated.id !== invite.id) return;
          console.log(`[Invites] Received DB status update for invite ${invite.id}:`, updated.status);
          
          if (updated.status === 'accepted') {
            supabase.removeChannel(inviteChannel);
            if (waitingInfo) waitingInfo.remove();
          } else if (updated.status === 'declined') {
            alert('Your duel invitation was declined.');
            supabase.removeChannel(inviteChannel);
            if (waitingInfo) waitingInfo.remove();
            pvpManager.disconnect();
            await updatePresence('online');
          }
        })
        .subscribe((status, err) => {
          console.log(`[Invites] DB invite status listener subscription: ${status}`, err || '');
        });
        
    } catch (err: any) {
      alert('Failed to invite friend: ' + err.message);
      if (waitingInfo) waitingInfo.remove();
      pvpManager.disconnect();
      await updatePresence('online');
    }
  }

  function subscribeToInvites() {
    if (!userUid) return;
    if (invitesChannel) supabase.removeChannel(invitesChannel);
    if (alertsChannel) supabase.removeChannel(alertsChannel);
    
    // 1. Instant Broadcast Channel
    console.log(`[Invites] Subscribing to instant alerts channel alerts:${userUid}...`);
    alertsChannel = supabase
      .channel(`alerts:${userUid}`)
      .on('broadcast', { event: 'invite' }, async (response: any) => {
        const invite = response.payload;
        console.log('[Invites] Received instant broadcast invitation:', invite);
        if (invitePopup) {
          const inviteText = document.getElementById('pvp-invite-text');
          if (inviteText) inviteText.textContent = `${invite.sender_name} has challenged you to a duel!`;
          invitePopup.style.display = 'flex';
          
          activeIncomingInviteId = invite.id;
          activeIncomingInviteSenderPeerId = invite.sender_peer_id;
        }
      })
      .subscribe((status, err) => {
        console.log(`[Invites] Alerts channel alerts:${userUid} subscription status: ${status}`, err || '');
      });

    // 2. Database Fallback (Postgres Changes) - Filterless in DB, checked in JS
    console.log('[Invites] Subscribing to database fallbacks channel...');
    invitesChannel = supabase
      .channel('incoming_invites')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'invites'
      }, async (payload: any) => {
        const invite = payload.new;
        if (invite.receiver_id !== userUid) return;
        if (invite.status !== 'pending') return;
        
        // If we already received and registered this invite via broadcast, skip
        if (activeIncomingInviteId === invite.id) return;
        console.log('[Invites] Received fallback database invitation:', invite);
        
        const { data: sender } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', invite.sender_id)
          .single();
          
        const senderName = sender?.display_name || 'Ronin';
        
        if (invitePopup) {
          const inviteText = document.getElementById('pvp-invite-text');
          if (inviteText) inviteText.textContent = `${senderName} has challenged you to a duel!`;
          invitePopup.style.display = 'flex';
          
          activeIncomingInviteId = invite.id;
          activeIncomingInviteSenderPeerId = invite.sender_peer_id;
        }
      })
      .subscribe((status, err) => {
        console.log(`[Invites] Database fallbacks subscription status: ${status}`, err || '');
      });
  }

  function subscribeToFriendsPresence() {
    if (friendsSubscription) supabase.removeChannel(friendsSubscription);
    
    friendsSubscription = supabase
      .channel('friends_presence')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload: any) => {
        const updated = payload.new;
        let changed = false;
        
        friends = friends.map(f => {
          if (f.profile && f.profile.id === updated.id) {
            changed = true;
            return {
              ...f,
              profile: updated
            };
          }
          return f;
        });
        
        if (changed) {
          renderFriendsList();
        }
      })
      .subscribe();
  }

  function subscribeToFriendships() {
    if (friendshipsSubscription) supabase.removeChannel(friendshipsSubscription);
    
    friendshipsSubscription = supabase
      .channel('friendships_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, () => {
        loadFriends();
      })
      .subscribe();
  }

  // --- Matchmaking Public Queue ---
  let queueInterval: any = null;
  let queueTimeElapsed = 0;

  async function startQueue() {
    const dropdown = document.getElementById('pvp-mode-select-dropdown') as HTMLSelectElement;
    const selectedMode = dropdown ? dropdown.value : 'classic';
    
    const findBtn = document.getElementById('pvp-find-match-btn');
    const queueStatus = document.getElementById('pvp-queue-status');
    
    if (findBtn) {
      findBtn.innerText = 'Cancel Queue';
      findBtn.style.borderColor = '#ef4444';
    }
    if (queueStatus) {
      queueStatus.style.display = 'block';
      queueStatus.innerHTML = `Searching for opponents... <span id="pvp-queue-timer">00:00</span>`;
    }
    
    queueTimeElapsed = 0;
    let myQueueStatus = 'queued';
    
    try {
      const peerId = await pvpManager.hostMatch();
      
      await supabase
        .from('profiles')
        .update({
          status: 'queued',
          queue_mode: selectedMode,
          peer_id: peerId,
          last_seen: new Date().toISOString()
        })
        .eq('id', userUid);
        
      if (queueInterval) clearInterval(queueInterval);
      queueInterval = setInterval(async () => {
        queueTimeElapsed += 3;
        const qTimer = document.getElementById('pvp-queue-timer');
        if (qTimer) {
          const mins = Math.floor(queueTimeElapsed / 60).toString().padStart(2, '0');
          const secs = (queueTimeElapsed % 60).toString().padStart(2, '0');
          qTimer.innerText = `${mins}:${secs}`;
        }
        
        await updatePresence(myQueueStatus);
        
        // Fetch all active profiles in the same queue mode
        const { data: candidates, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('queue_mode', selectedMode)
          .neq('id', userUid);
          
        if (error) {
          console.error('Queue search error:', error);
          return;
        }
        
        const activeCandidates = (candidates || []).filter(c => {
          const lastSeenDate = new Date(c.last_seen);
          const diffMs = Math.abs(Date.now() - lastSeenDate.getTime());
          return diffMs < 120000 && (c.status.startsWith('queued') || c.status === 'busy');
        });
        
        // 1. Check if we already designated an opponent, and check if they accepted
        if (myQueueStatus.startsWith('queued:')) {
          const targetOpponentId = myQueueStatus.split(':')[1];
          const opponent = activeCandidates.find(c => c.id === targetOpponentId);
          
          if (opponent) {
            // If the opponent is busy, or matched back with us, we are good to transition!
            if (opponent.status === 'busy' || opponent.status === 'queued:' + userUid) {
              clearInterval(queueInterval);
              queueInterval = null;
              
              if (queueStatus) queueStatus.innerText = 'Opponent found! Connecting...';
              
              await updatePresence('busy', { queue_mode: null });
              // Host just stays as host and waits for connection
              showStep('ready');
              return;
            }
            // Otherwise, we keep waiting
            return;
          } else {
            // Opponent must have timed out or cancelled, reset our queue status
            myQueueStatus = 'queued';
            await updatePresence('queued');
          }
        }
        
        // 2. Check if there is any host that has selected us
        const matchedHost = activeCandidates.find(c => c.status === 'queued:' + userUid);
        if (matchedHost) {
          clearInterval(queueInterval);
          queueInterval = null;
          
          if (queueStatus) queueStatus.innerText = 'Opponent found! Connecting...';
          
          await updatePresence('busy', { queue_mode: null });
          pvpManager.disconnect();
          try {
            showStep('ready');
            await pvpManager.joinMatch(matchedHost.peer_id);
          } catch (err: any) {
            alert('Matchmaking connection failed: ' + err.message);
            stopQueue();
          }
          return;
        }
        
        // 3. Otherwise, look for someone who is simply 'queued'
        const queuedOpponent = activeCandidates.find(c => c.status === 'queued');
        if (queuedOpponent) {
          const myShortId = userProfile.short_id;
          const oppShortId = queuedOpponent.short_id;
          
          // Determine roles: Host has smaller short_id
          if (myShortId < oppShortId) {
            myQueueStatus = 'queued:' + queuedOpponent.id;
            await updatePresence(myQueueStatus);
          }
          // Client does nothing, waits for host's status to update to 'queued:' + userUid
        }
        
      }, 3000);
      
    } catch (err: any) {
      alert('Failed to enter matchmaking: ' + err.message);
      stopQueue();
    }
  }

  async function stopQueue() {
    if (queueInterval) {
      clearInterval(queueInterval);
      queueInterval = null;
    }
    
    const findBtn = document.getElementById('pvp-find-match-btn');
    const queueStatus = document.getElementById('pvp-queue-status');
    
    if (findBtn) {
      findBtn.innerText = 'Find Match';
      findBtn.style.borderColor = '#10b981';
    }
    if (queueStatus) queueStatus.style.display = 'none';
    
    pvpManager.disconnect();
    await updatePresence('online', { queue_mode: null, peer_id: null });
  }

  // --- Leaderboard Queries & Rendering ---
  async function loadLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, short_id, pvp_wins, pvp_losses')
        .order('pvp_wins', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      renderLeaderboard(data || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  }

  function renderLeaderboard(records: any[]) {
    const container = document.getElementById('pvp-leaderboard-container');
    if (!container) return;
    
    if (records.length === 0) {
      container.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 20px;">No records yet.</div>`;
      return;
    }
    
    container.innerHTML = '';
    
    records.forEach((record, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.background = 'rgba(255,255,255,0.03)';
      row.style.padding = '8px 12px';
      row.style.borderRadius = '6px';
      row.style.border = '1px solid rgba(255,255,255,0.05)';
      
      if (index === 0) row.style.border = '1px solid rgba(255, 215, 0, 0.4)';
      else if (index === 1) row.style.border = '1px solid rgba(192, 192, 192, 0.4)';
      else if (index === 2) row.style.border = '1px solid rgba(205, 127, 50, 0.4)';
      
      const rankNameCol = document.createElement('div');
      rankNameCol.style.display = 'flex';
      rankNameCol.style.alignItems = 'center';
      rankNameCol.style.gap = '8px';
      
      const rankSpan = document.createElement('span');
      rankSpan.textContent = `#${index + 1}`;
      rankSpan.style.fontFamily = 'monospace';
      rankSpan.style.fontSize = '14px';
      rankSpan.style.fontWeight = 'bold';
      
      if (index === 0) rankSpan.style.color = '#ffd700';
      else if (index === 1) rankSpan.style.color = '#c0c0c0';
      else if (index === 2) rankSpan.style.color = '#cd7f32';
      else rankSpan.style.color = 'rgba(255,255,255,0.4)';
      
      const nameCol = document.createElement('div');
      nameCol.style.display = 'flex';
      nameCol.style.flexDirection = 'column';
      nameCol.style.textAlign = 'left';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = record.display_name;
      nameSpan.style.color = '#fff';
      nameSpan.style.fontSize = '13px';
      nameSpan.style.fontFamily = 'Orbitron';
      
      const uidSpan = document.createElement('span');
      uidSpan.textContent = `UID: ${record.short_id}`;
      uidSpan.style.color = 'rgba(255,255,255,0.4)';
      uidSpan.style.fontSize = '10px';
      uidSpan.style.fontFamily = 'monospace';
      
      nameCol.appendChild(nameSpan);
      nameCol.appendChild(uidSpan);
      
      rankNameCol.appendChild(rankSpan);
      rankNameCol.appendChild(nameCol);
      
      const statsCol = document.createElement('div');
      statsCol.style.fontFamily = 'monospace';
      statsCol.style.fontSize = '12px';
      
      const winsSpan = document.createElement('span');
      winsSpan.textContent = `${record.pvp_wins || 0} W`;
      winsSpan.style.color = '#10b981';
      
      const separator = document.createElement('span');
      separator.textContent = ' - ';
      separator.style.color = 'rgba(255,255,255,0.2)';
      
      const lossesSpan = document.createElement('span');
      lossesSpan.textContent = `${record.pvp_losses || 0} L`;
      lossesSpan.style.color = '#ef4444';
      
      statsCol.appendChild(winsSpan);
      statsCol.appendChild(separator);
      statsCol.appendChild(lossesSpan);
      
      row.appendChild(rankNameCol);
      row.appendChild(statsCol);
      
      container.appendChild(row);
    });
  }

  // --- Tab Switchers ---
  const tabFriends = document.getElementById('pvp-tab-friends');
  const tabRequests = document.getElementById('pvp-tab-requests');
  const tabLeaderboard = document.getElementById('pvp-tab-leaderboard');
  
  const contentFriends = document.getElementById('pvp-content-friends');
  const contentRequests = document.getElementById('pvp-content-requests');
  const contentLeaderboard = document.getElementById('pvp-content-leaderboard');
  
  function selectTab(activeTab: HTMLElement, activeContent: HTMLElement) {
    [tabFriends, tabRequests, tabLeaderboard].forEach(t => {
      if (t) {
        t.style.background = 'transparent';
        t.style.borderColor = 'transparent';
        t.style.color = '#9ca3af';
      }
    });
    [contentFriends, contentRequests, contentLeaderboard].forEach(c => {
      if (c) c.style.display = 'none';
    });
    
    activeTab.style.background = 'rgba(255,255,255,0.1)';
    activeTab.style.borderColor = 'rgba(245,158,11,0.4)';
    activeTab.style.color = '#f59e0b';
    activeContent.style.display = 'flex';
  }
  
  if (tabFriends && contentFriends) {
    tabFriends.addEventListener('click', () => selectTab(tabFriends, contentFriends));
  }
  if (tabRequests && contentRequests) {
    tabRequests.addEventListener('click', () => selectTab(tabRequests, contentRequests));
  }
  if (tabLeaderboard && contentLeaderboard) {
    tabLeaderboard.addEventListener('click', () => {
      selectTab(tabLeaderboard, contentLeaderboard);
      loadLeaderboard();
    });
  }

  // --- Find Match public queue hook ---
  const findMatchBtn = document.getElementById('pvp-find-match-btn');
  let inQueue = false;
  
  if (findMatchBtn) {
    findMatchBtn.addEventListener('click', () => {
      if (inQueue) {
        stopQueue();
        inQueue = false;
      } else {
        startQueue();
        inQueue = true;
      }
    });
  }

  // Trigger Supabase login and invite subscription on startup in the background
  initSupabaseAuth().catch(err => {
    console.error("Failed to initialize social auth on startup:", err);
  });
}

/**
 * Updates HUD elements during an active PvP round.
 */
export function updatePvpHud() {
  const p1Hearts = document.getElementById('pvp-p1-hearts');
  const p2Hearts = document.getElementById('pvp-p2-hearts');
  const roundIndicator = document.getElementById('pvp-round-indicator');
  const rallyCounter = document.getElementById('pvp-rally-counter');

  if (p1Hearts) p1Hearts.innerText = '❤️'.repeat(Math.max(0, pvpManager.p1Lives)) || '💀';
  if (p2Hearts) p2Hearts.innerText = '❤️'.repeat(Math.max(0, pvpManager.p2Lives)) || '💀';
  
  // Set custom player names!
  const p1NameEl = document.querySelector('.pvp-left-hud .pvp-player-name') as HTMLElement;
  const p2NameEl = document.querySelector('.pvp-right-hud .pvp-player-name') as HTMLElement;
  if (p1NameEl) p1NameEl.innerText = pvpManager.p1Name || 'Host';
  if (p2NameEl) p2NameEl.innerText = pvpManager.p2Name || 'Guest';

  if (roundIndicator) {
    let modeLabel = '';
    if (pvpManager.subMode === 'sudden_death') modeLabel = ' (SUDDEN DEATH)';
    else if (pvpManager.subMode === 'hyper_speed') modeLabel = ' (HYPER SPEED)';
    else if (pvpManager.subMode === 'storm_god') modeLabel = ' (STORM GOD)';
    else if (pvpManager.subMode === 'insane_survival') modeLabel = ' (CO-OP SURVIVAL)';
    roundIndicator.innerText = `ROUND ${pvpManager.round}${modeLabel}`;
  }
  
  if (rallyCounter) {
    if (pvpManager.subMode === 'insane_survival') {
      const p1Kills = (globals as any).p1Kills || 0;
      const p2Kills = (globals as any).p2Kills || 0;
      rallyCounter.innerText = `KILLS - ${pvpManager.p1Name}: ${p1Kills} | ${pvpManager.p2Name}: ${p2Kills}`;
    } else {
      let baseMult = 1.0;
      let scaleFactor = 0.15;
      if (pvpManager.subMode === 'sudden_death') {
        baseMult = 1.4;
        scaleFactor = 0.2;
      } else if (pvpManager.subMode === 'hyper_speed') {
        baseMult = 1.0;
        scaleFactor = 0.35;
      }
      const mult = (baseMult + pvpManager.rallyCount * scaleFactor).toFixed(2);
      rallyCounter.innerText = `RALLY: ${pvpManager.rallyCount} (${mult}x Speed)`;
    }
  }
}

/**
 * Triggers a full-screen dynamic countdown or round announcement banner.
 */
export function showRoundBanner(title: string, subtitle: string, durationMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    const banner = document.getElementById('pvp-banner');
    const bTitle = document.getElementById('pvp-banner-title');
    const bSub = document.getElementById('pvp-banner-subtitle');

    if (!banner || !bTitle || !bSub) {
      resolve();
      return;
    }

    bTitle.innerText = title;
    bSub.innerText = subtitle;
    banner.style.display = 'block';

    setTimeout(() => {
      banner.style.display = 'none';
      resolve();
    }, durationMs);
  });
}

/**
 * Updates the turn action hint badge at the bottom of the screen.
 */
export function updateTurnBadge() {
  const badge = document.getElementById('pvp-turn-badge');
  if (!badge) return;

  const isMyTurn = (pvpManager.currentTurn === 'left' && pvpManager.role === 'host') || 
                   (pvpManager.currentTurn === 'right' && pvpManager.role === 'client');

  const activeShockwaves = document.getElementById('pvp-hud')?.dataset.hasShockwave === 'true';
  const hasFriendly = document.getElementById('pvp-hud')?.dataset.hasFriendly === 'true';

  if (activeShockwaves) {
    badge.innerText = 'DEFEND: TIMED PARRY!';
    badge.style.color = '#ffaa00';
    badge.style.borderColor = '#ffaa00';
  } else if (hasFriendly) {
    badge.innerText = 'WAITING FOR OPPONENT...';
    badge.style.color = '#9ca3af';
    badge.style.borderColor = 'rgba(255,255,255,0.15)';
  } else if (isMyTurn) {
    badge.innerText = 'YOUR TURN: CHARGE [HOLD SLASH]';
    badge.style.color = '#10b981';
    badge.style.borderColor = '#10b981';
  } else {
    badge.innerText = 'WAITING FOR OPPONENT...';
    badge.style.color = '#9ca3af';
    badge.style.borderColor = 'rgba(255,255,255,0.15)';
  }
}

/**
 * Toggles the visibility of the Parry Lockout error text.
 */
export function showParryLockout(show: boolean) {
  const lockout = document.getElementById('pvp-cooldown-indicator');
  if (lockout) {
    lockout.style.display = show ? 'block' : 'none';
  }
}

/**
 * Updates stats in the database on match result.
 */
export async function recordMatchResult(isWin: boolean) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;
    const uid = session.user.id;
    
    // Fetch current wins/losses
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('pvp_wins, pvp_losses')
      .eq('id', uid)
      .single();
      
    if (fetchErr || !profile) throw fetchErr || new Error('Profile not found');
    
    const updates: any = {};
    if (isWin) {
      updates.pvp_wins = (profile.pvp_wins || 0) + 1;
    } else {
      updates.pvp_losses = (profile.pvp_losses || 0) + 1;
    }
    
    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', uid);
      
    if (updateErr) throw updateErr;
    console.log(`PVP stats updated: win=${isWin}`);
  } catch (err) {
    console.error('Failed to update match result:', err);
  }
}


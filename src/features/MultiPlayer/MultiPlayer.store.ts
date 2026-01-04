import { defineStore } from "pinia";
import { ref, type Ref, shallowRef, computed } from "vue";
import { Peer, type DataConnection } from "peerjs";
import { invoke } from "@tauri-apps/api/core";
import { useStorage } from "@vueuse/core";

export interface Friend {
  peerId: string;
  name: string;
}

export interface ChatMessage {
  senderId: string;
  text: string;
  timestamp: number;
}

export const useMultiPlayerStore = defineStore("MultiPlayer", () => {
  const peer = shallowRef<Peer | null>(null);
  const selfPeerId = ref<string>("");
  const selfName = useStorage<string>("MultiPlayer_selfName", "Unknown user");
  const friends = useStorage<Friend[]>("MultiPlayer_friends", []);
  
  // connection map: peerId -> DataConnection
  const connections = shallowRef<Record<string, DataConnection>>({});
  
  // peerId -> ChatMessage[]
  const messages = ref<Record<string, ChatMessage[]>>({});

  const connectedFriends = computed(() => {
    return friends.value.filter(friend => {
      const conn = connections.value[friend.peerId];
      return conn && conn.open;
    });
  });

  const getMachineId = async (): Promise<string> => {
    try {
      return await invoke<string>("get_machine_id");
    } catch (e) {
      console.error("Failed to get machine id:", e);
      return "unknown-machine-" + Math.random().toString(36).substring(7);
    }
  };

  const init = async () => {
    if (peer.value) return;

    let id = localStorage.getItem("MultiPlayer_peerId");
    if (!id) {
      const machineId = await getMachineId();
      // Use machineId as part of peerId or just use it. 
      // Plan says: "从localstorage中取得自身昵称-peerid...如果不存在，使用机器id和默认昵称"
      // PeerJS ID must be string.
      // Let's use machineId as peerId for stability if possible, but PeerJS server might resolve conflicts.
      // If we want a persistent ID, using machine ID is good.
      id = machineId;
      localStorage.setItem("MultiPlayer_peerId", id);
    }
    selfPeerId.value = id;

    const newPeer = new Peer(id, {
      debug: 2,
    });

    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      selfPeerId.value = id;
    });

    newPeer.on("connection", (conn) => {
      setupConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.value = newPeer;

    // Try to connect to all friends
    friends.value.forEach((friend) => {
      connectToFriend(friend.peerId);
    });
  };

  const setupConnection = (conn: DataConnection) => {
    conn.on("open", () => {
      // Add to connections
      connections.value = {
        ...connections.value,
        [conn.peer]: conn,
      };

      conn.send({ type: 'GET_NAME' });
      
      // Register methods
      conn.on("data", (data: any) => {
        handleData(conn, data);
      });
    });

    conn.on("close", () => {
      const newConns = { ...connections.value };
      delete newConns[conn.peer];
      connections.value = newConns;
    });
    
    conn.on("error", () => {
      const newConns = { ...connections.value };
      delete newConns[conn.peer];
      connections.value = newConns;
    });
  };

  const handleData = (conn: DataConnection, data: any) => {
    if (data && typeof data === 'object') {
      if (data.type === 'GET_NAME') {
        conn.send({ type: 'NAME', payload: selfName.value });
      } else if (data.type === 'NAME') {
        const friend = friends.value.find(f => f.peerId === conn.peer);
        if (friend) {
            friend.name = data.payload;
        }
      } else if (data.type === 'CHAT') {
        const msg: ChatMessage = {
          senderId: conn.peer,
          text: data.payload,
          timestamp: Date.now()
        };
        addMessage(conn.peer, msg);
      }
    }
  };

  const addFriend = (peerId: string, name: string) => {
    if (!friends.value.find(f => f.peerId === peerId)) {
      friends.value.push({ peerId, name });
      connectToFriend(peerId);
    }
  };

  const removeFriend = (peerId: string) => {
    friends.value = friends.value.filter(f => f.peerId !== peerId);
    const conn = connections.value[peerId];
    if (conn) {
      conn.close();
    }
  };

  const connectToFriend = (peerId: string) => {
    if (!peer.value) return;
    if (connections.value[peerId] && connections.value[peerId].open) return;

    const conn = peer.value.connect(peerId);
    setupConnection(conn);
  };

  const setSelfName = (name: string) => {
    selfName.value = name;
  };
  
  const sendMessage = (peerId: string, message: any) => {
      const conn = connections.value[peerId];
      if (conn && conn.open) {
          conn.send(message);
      }
  };

  const sendChatMessage = (peerId: string, text: string) => {
    sendMessage(peerId, { type: 'CHAT', payload: text });
    const msg: ChatMessage = {
      senderId: selfPeerId.value,
      text: text,
      timestamp: Date.now()
    };
    addMessage(peerId, msg);
  };

  const addMessage = (peerId: string, msg: ChatMessage) => {
    if (!messages.value[peerId]) {
      messages.value[peerId] = [];
    }
    messages.value[peerId].push(msg);
  };

  return {
    peer,
    selfPeerId,
    selfName,
    friends,
    connections,
    connectedFriends,
    init,
    addFriend,
    removeFriend,
    connectToFriend,
    setSelfName,
    sendMessage,
    sendChatMessage,
    messages
  };
});

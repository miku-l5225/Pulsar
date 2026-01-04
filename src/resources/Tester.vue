<template>
  <div class="flex h-full w-full bg-background text-foreground overflow-hidden shadow-sm border border-border rounded-lg">
    <!-- Sidebar -->
    <div class="w-64 border-r border-border bg-muted/20 flex flex-col">
       <div class="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">
         <span>好友列表</span>
         <span class="text-xs text-muted-foreground">{{ store.connectedFriends.length }}/{{ store.friends.length }} 在线</span>
       </div>
       <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-for="friend in store.friends" 
               :key="friend.peerId"
               class="p-2 rounded-md cursor-pointer flex items-center gap-3 hover:bg-accent/50 transition-colors"
               :class="{'bg-accent': selectedPeerId === friend.peerId}"
               @click="selectedPeerId = friend.peerId">
             <div class="relative flex h-2.5 w-2.5">
                <span v-if="isConnected(friend.peerId)" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="isConnected(friend.peerId) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"></span>
             </div>
             <div class="flex-1 overflow-hidden">
                <div class="truncate text-sm font-medium">{{ friend.name }}</div>
                <div class="truncate text-[10px] text-muted-foreground opacity-70">{{ friend.peerId }}</div>
             </div>
          </div>
       </div>
    </div>
    
    <!-- Chat Area -->
    <div class="flex-1 flex flex-col bg-background">
       <div v-if="!selectedPeerId" class="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <MessageSquare class="w-12 h-12 opacity-20" />
          <p class="text-sm">选择一个好友开始聊天</p>
       </div>
       <template v-else>
         <div class="h-14 px-4 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
            <div class="flex flex-col">
               <span class="font-medium text-sm">{{ selectedFriendName }}</span>
               <span class="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                 <span class="w-1.5 h-1.5 rounded-full" :class="isConnected(selectedPeerId) ? 'bg-green-500' : 'bg-gray-400'"></span>
                 {{ selectedPeerId }}
               </span>
            </div>
         </div>
         
         <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="chatContainer">
            <template v-if="currentMessages.length > 0">
                <div v-for="(msg, idx) in currentMessages" :key="idx" class="flex flex-col"
                    :class="msg.senderId === store.selfPeerId ? 'items-end' : 'items-start'">
                <div class="max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm"
                        :class="msg.senderId === store.selfPeerId ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'">
                    {{ msg.text }}
                </div>
                <span class="text-[10px] text-muted-foreground mt-1 px-1">{{ formatTime(msg.timestamp) }}</span>
                </div>
            </template>
            <div v-else class="flex h-full items-center justify-center">
                <span class="text-xs text-muted-foreground">暂无消息历史</span>
            </div>
         </div>
         
         <div class="p-4 border-t border-border bg-muted/10">
            <div class="flex gap-2">
                <Input 
                    v-model="messageText" 
                    @keyup.enter="sendMessage" 
                    :disabled="!isConnected(selectedPeerId)"
                    :placeholder="isConnected(selectedPeerId) ? '发送消息...' : '对方不在线'" 
                    class="flex-1 bg-background" 
                />
                <Button @click="sendMessage" size="icon" :disabled="!messageText.trim() || !isConnected(selectedPeerId)">
                    <Send class="w-4 h-4" />
                </Button>
            </div>
         </div>
       </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useMultiPlayerStore } from "@/features/MultiPlayer/MultiPlayer.store";
import { MessageSquare, Send } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const store = useMultiPlayerStore();
const selectedPeerId = ref<string>("");
const messageText = ref("");
const chatContainer = ref<HTMLElement | null>(null);

const selectedFriendName = computed(() => {
    const friend = store.friends.find(f => f.peerId === selectedPeerId.value);
    return friend ? friend.name : 'Unknown';
});

const currentMessages = computed(() => {
    if (!selectedPeerId.value) return [];
    return store.messages[selectedPeerId.value] || [];
});

const isConnected = (peerId: string) => {
    const conn = store.connections[peerId];
    return conn && conn.open;
};

const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sendMessage = () => {
    if (!messageText.value.trim() || !selectedPeerId.value) return;
    store.sendChatMessage(selectedPeerId.value, messageText.value);
    messageText.value = "";
    scrollToBottom();
};

const scrollToBottom = () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    });
};

watch(() => currentMessages.value.length, () => {
    scrollToBottom();
});

watch(selectedPeerId, () => {
    scrollToBottom();
});

</script>

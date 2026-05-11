import type { ChatMessage, ChatUser, Conversation } from "./types";

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(
    seed,
  )}`;
}

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000).toISOString();
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

export const seedUsers: ChatUser[] = [
  {
    id: "d1",
    name: "Dr. Alaa Hamed",
    role: "doctor",
    specialty: "Cardiology",
    avatarUrl: avatar("alaa-hamed"),
    presence: "online",
    lastSeenAt: minutes(0),
  },
  {
    id: "d2",
    name: "Dr. Mona Saleh",
    role: "doctor",
    specialty: "Dermatology",
    avatarUrl: avatar("mona-saleh"),
    presence: "online",
    lastSeenAt: minutes(2),
  },
  {
    id: "s1",
    name: "3elagi Support",
    role: "support",
    avatarUrl: avatar("3elagi-support"),
    presence: "online",
    lastSeenAt: minutes(0),
  },
  {
    id: "d3",
    name: "Dr. Karim Naguib",
    role: "doctor",
    specialty: "Pediatrics",
    avatarUrl: avatar("karim-naguib"),
    presence: "away",
    lastSeenAt: minutes(15),
  },
  {
    id: "d4",
    name: "Dr. Hala Fawzy",
    role: "doctor",
    specialty: "Gynecology",
    avatarUrl: avatar("hala-fawzy"),
    presence: "offline",
    lastSeenAt: hours(3),
  },
  {
    id: "d5",
    name: "Dr. Yasmin Adel",
    role: "doctor",
    specialty: "Internal medicine",
    avatarUrl: avatar("yasmin-adel"),
    presence: "offline",
    lastSeenAt: hours(8),
  },
  {
    id: "d6",
    name: "Dr. Omar Ezz",
    role: "doctor",
    specialty: "Orthopedics",
    avatarUrl: avatar("omar-ezz"),
    presence: "offline",
    lastSeenAt: days(1),
  },
  {
    id: "d7",
    name: "Dr. Sara Mostafa",
    role: "doctor",
    specialty: "ENT",
    avatarUrl: avatar("sara-mostafa"),
    presence: "online",
    lastSeenAt: minutes(1),
  },
  {
    id: "d8",
    name: "Dr. Tamer Helmy",
    role: "doctor",
    specialty: "Urology",
    avatarUrl: avatar("tamer-helmy"),
    presence: "offline",
    lastSeenAt: days(2),
  },
];

const seedConversations: Record<string, ChatMessage[]> = {
  d1: [
    {
      id: "m1",
      conversationId: "d1",
      senderId: "d1",
      text: "Hello! How are you feeling today?",
      createdAt: minutes(40),
    },
    {
      id: "m2",
      conversationId: "d1",
      senderId: "me",
      text: "Better, thank you doctor.",
      createdAt: minutes(38),
    },
    {
      id: "m3",
      conversationId: "d1",
      senderId: "d1",
      text: "Great. Keep taking the prescription twice a day.",
      createdAt: minutes(2),
    },
  ],
  d2: [
    {
      id: "m4",
      conversationId: "d2",
      senderId: "d2",
      text: "Please send me a photo of the area when possible.",
      createdAt: hours(2),
    },
  ],
  s1: [
    {
      id: "m5",
      conversationId: "s1",
      senderId: "s1",
      text: "Welcome to 3elagi! Need help finding a doctor?",
      createdAt: hours(5),
    },
  ],
  d3: [
    {
      id: "m6",
      conversationId: "d3",
      senderId: "d3",
      text: "Bring the lab results to the next visit.",
      createdAt: hours(20),
    },
  ],
  d4: [
    {
      id: "m7",
      conversationId: "d4",
      senderId: "me",
      text: "Thanks doctor, see you next week.",
      createdAt: days(1),
    },
  ],
  d7: [
    {
      id: "m8",
      conversationId: "d7",
      senderId: "d7",
      text: "Your throat swab came back negative.",
      createdAt: minutes(10),
    },
  ],
};

export const chatRepository = {
  listConversations(): Conversation[] {
    return seedUsers.map((u) => {
      const msgs = seedConversations[u.id] || [];
      const last = msgs[msgs.length - 1];
      return {
        id: u.id,
        user: u,
        lastMessage: last,
        unreadCount:
          last && last.senderId !== "me" && Math.random() > 0.6 ? 1 : 0,
      };
    });
  },
  getMessages(conversationId: string): ChatMessage[] {
    return [...(seedConversations[conversationId] || [])];
  },
  appendMessage(conversationId: string, text: string): ChatMessage {
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId: "me",
      text,
      createdAt: new Date().toISOString(),
    };
    seedConversations[conversationId] = [
      ...(seedConversations[conversationId] || []),
      msg,
    ];
    return msg;
  },
  simulateReply(conversationId: string): ChatMessage | null {
    const user = seedUsers.find((u) => u.id === conversationId);
    if (!user || user.presence === "offline") return null;
    const replies = [
      "Got it, thank you.",
      "Understood, I'll check.",
      "Please send more details.",
      "Take care of yourself.",
      "Schedule a follow-up if symptoms persist.",
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];
    const msg: ChatMessage = {
      id: `m-${Date.now()}-r`,
      conversationId,
      senderId: conversationId,
      text,
      createdAt: new Date().toISOString(),
    };
    seedConversations[conversationId] = [
      ...(seedConversations[conversationId] || []),
      msg,
    ];
    return msg;
  },
};

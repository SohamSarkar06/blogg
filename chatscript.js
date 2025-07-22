window.addEventListener('DOMContentLoaded', () => {
      const firebaseConfig = {
        apiKey: "AIzaSyAq95vU6ks35SOJ8yh-ACr3xJmuz3Z9BAI",
        authDomain: "blogsh-1fb30.firebaseapp.com",
        databaseURL: "https://blogsh-1fb30-default-rtdb.firebaseio.com",
        projectId: "blogsh-1fb30",
        storageBucket: "blogsh-1fb30.appspot.com",
        messagingSenderId: "621522269665",
        appId: "1:621522269665:web:6e0075fef40dd094b9cea0"
      };

      firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.database();

      let currentUserId = "";
      let currentUsername = "";
      let selectedUserId = "";
      let userMap = {};
      let messageListeners = {};

      const userList = document.getElementById("userList");
      const userSearch = document.getElementById("userSearch");
      const chatBox = document.getElementById("chatBox");

      // Environment-safe Notification
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        Notification.requestPermission().catch(() => {});
      }

      auth.onAuthStateChanged(user => {
        if (!user) {
          if (typeof window !== "undefined") {
            alert("Not logged in");
            window.location.href = "index.html";
          }
          return;
        }

        currentUserId = user.uid;
        db.ref("users/" + user.uid + "/username").once("value")
          .then(snap => currentUsername = snap.val() || "You")
          .then(() => {
            loadUserList();
            listenForAllChats();
          });
      });

      userSearch.addEventListener("input", () => renderUserList(userSearch.value));

      function loadUserList() {
        db.ref("users").once("value", snapshot => {
          const promises = [];
          const tempMap = {};

          snapshot.forEach(child => {
            const uid = child.key;
            if (uid === currentUserId) return;

            const username = child.val().username;
            const chatId = [currentUserId, uid].sort().join("_");

            const p = db.ref("chats/" + chatId).limitToLast(1).once("value").then(snap => {
              let latest = 0;
              snap.forEach(msg => latest = msg.val().timestamp || 0);
              return db.ref("lastRead/" + currentUserId + "/" + chatId).once("value").then(readSnap => {
                const lastRead = readSnap.val() || 0;
                tempMap[uid] = {
                  username,
                  unread: latest > lastRead,
                  latestTimestamp: latest
                };
              });
            });

            promises.push(p);
          });

          Promise.all(promises).then(() => {
            userMap = Object.fromEntries(
              Object.entries(tempMap).sort(([, a], [, b]) => b.latestTimestamp - a.latestTimestamp)
            );
            renderUserList();
          });
        });
      }

      function renderUserList(filter = "") {
        userList.innerHTML = "";
        Object.entries(userMap).forEach(([uid, data]) => {
          const { username, unread } = data;
          if (!username.toLowerCase().includes(filter.toLowerCase())) return;

          const div = document.createElement("div");
          div.className = "user-item" + (uid === selectedUserId ? " active" : "");
          div.dataset.uid = uid;
          div.onclick = () => {
            selectedUserId = uid;
            document.querySelectorAll('.user-item').forEach(el => el.classList.remove("active"));
            div.classList.add("active");
            openChatView(username);
            listenForMessages();
            loadUserList();
          };

          div.innerHTML = `
            ${username}
            ${unread ? '<span style="float:right; background:red; color:white; padding:3px 8px; border-radius:50%;">●</span>' : ''}
          `;
          userList.appendChild(div);
        });
      }

      function sendMessage() {
        const input = document.getElementById("messageInput");
        const msg = input.value.trim();
        if (!selectedUserId || !msg) return;

        const chatId = [currentUserId, selectedUserId].sort().join("_");
        db.ref("chats/" + chatId).push({
          senderId: currentUserId,
          senderName: currentUsername,
          message: msg,
          timestamp: Date.now()
        });

        input.value = "";
      }

      document.getElementById("messageInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
      });

      function listenForMessages() {
        chatBox.innerHTML = "";
        if (!selectedUserId) return;
        const chatId = [currentUserId, selectedUserId].sort().join("_");
        const chatRef = db.ref("chats/" + chatId);
        chatRef.off();
        db.ref("lastRead/" + currentUserId + "/" + chatId).set(Date.now());

        chatRef.on("child_added", snap => {
          const msg = snap.val();
          const div = document.createElement("div");
          div.className = "message " + (msg.senderId === currentUserId ? "you" : "other");
          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          div.innerHTML = `<div>${msg.message}</div><div class="timestamp">${time}</div>`;
          chatBox.appendChild(div);
          chatBox.scrollTop = chatBox.scrollHeight;
        });
      }

      function listenForAllChats() {
        db.ref("users").once("value", snapshot => {
          snapshot.forEach(child => {
            const otherId = child.key;
            if (otherId === currentUserId) return;
            const chatId = [currentUserId, otherId].sort().join("_");
            if (messageListeners[chatId]) return;

            const chatRef = db.ref("chats/" + chatId).limitToLast(1);
            chatRef.on("child_added", snap => {
              const msg = snap.val();
              if (msg.senderId !== currentUserId && otherId !== selectedUserId) {
                if (userMap[otherId]) userMap[otherId].unread = true;
                renderUserList(userSearch.value);

                if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                  new Notification(`New message from ${userMap[otherId]?.username || "Someone"}`, {
                    body: msg.message,
                    icon: "https://img.icons8.com/external-others-inmotus-design/67/external-Dot-keyboard-others-inmotus-design-5.png"
                  });
                }
              }
            });

            messageListeners[chatId] = true;
          });
        });
      }

      function openChatView(username) {
  const chatHeader = document.getElementById("chatHeaderName");
  chatHeader.textContent = username;
  chatHeader.onclick = () => {
    if (selectedUserId) {
      window.location.href = `user.html?uid=${selectedUserId}`;
    }
  };
  document.getElementById("chatArea").classList.add("active");
}
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blogId = urlParams.get("shareBlogId");
  const title = urlParams.get("title");
  const content = urlParams.get("content");
  const uidToChat = urlParams.get("uid");
  if (uidToChat) {
    openChatWithUser(uidToChat);
  } else {
    loadUserList(); // fallback
  }
  if (blogId && title && content) {
    // Display the blog preview or attach it to the chat message
    alert(`You're sharing this blog:\n\nTitle: ${decodeURIComponent(title)}\nContent: ${decodeURIComponent(content)}`);
    // Now let the user choose a friend and send it as a message
  }
};

      function goBack() {
        document.getElementById("chatArea").classList.remove("active");
      }

      window.sendMessage = sendMessage;
      window.goBack = goBack;
    });
window.addEventListener("load", () => {
  const selectedUserId = localStorage.getItem("chatUserId");
  const selectedUsername = localStorage.getItem("chatUsername");

  if (selectedUserId && selectedUsername) {
    // Clear it after use
    localStorage.removeItem("chatUserId");
    localStorage.removeItem("chatUsername");

    // Auto-open chat with that user
    openChat(selectedUserId, selectedUsername);
  }
});
function openChatWithUser(uid) {
  if (uid === currentUserId) return;

  db.ref("users/" + uid).once("value").then(snap => {
    const user = snap.val();
    if (!user) return;

    selectedUserId = uid;
    document.getElementById("chatUserName").textContent = user.username;
    document.getElementById("chatUserPic").src = user.profile || "https://i.postimg.cc/0N3pdBf3/defaultpfp.jpg";
    document.getElementById("chatBox").innerHTML = "";

    // Start chat listener
    listenForMessages();

    // Show chat section
    document.getElementById("chatSection").style.display = "block";
    document.getElementById("welcomeSection").style.display = "none";
  });
}

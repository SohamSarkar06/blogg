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
    

    auth.onAuthStateChanged(user => {
      if (user) {
        currentUserId = user.uid;
        checkUserProfile(currentUserId);
      } else {
        document.getElementById("auth-section").style.display = "block";
      }
    });

    function login() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          currentUserId = userCredential.user.uid;
          checkUserProfile(currentUserId);
        })
        .catch((error) => alert(error.message));
    }

    function signup() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          currentUserId = userCredential.user.uid;
          document.getElementById("auth-section").style.display = "none";
          document.getElementById("account-section").style.display = "block";
        })
        .catch((error) => alert(error.message));
    }

  function createAccount() {
  const username = document.getElementById("username").value.trim().toLowerCase();
  if (!username) {
    alert("Please enter a username.");
    return;
  }

  db.ref("users").orderByChild("username").equalTo(username).once("value", (snapshot) => {
    if (snapshot.exists()) {
      alert("Username is already taken. Please choose another.");
    } else {
      db.ref("users/" + currentUserId).set({ username }).then(() => {
        loadDashboard(username);
      });
    }
  });
}


    function checkUserProfile(uid) {
      db.ref("users/" + uid).once("value").then((snapshot) => {
        if (snapshot.exists()) {
          const username = snapshot.val().username;
          currentUsername = username;
          loadDashboard(username);
        } else {
          document.getElementById("auth-section").style.display = "none";
          document.getElementById("account-section").style.display = "block";
        }
      });
    }

    function loadDashboard(username) {
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("account-section").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      document.getElementById("display-username").innerText = username;
       fetchNotes();
      fetchBlogs();
    }

    function logout() {
       location.href = `index.html?uid=${currentUserId}&username=${encodeURIComponent(currentUsername)}`;
      }
        function goToMyBlogs() {
        location.href = `myblogs.html?uid=${currentUserId}&username=${encodeURIComponent(currentUsername)}`;
    }

      function fetchBlogs() {
      db.ref("blogs").once("value").then(async (snapshot) => {
        const blogs = snapshot.val();
        if (!blogs) {
          document.getElementById("blog-section").innerHTML = "<p>No blogs yet.</p>";
          return;
        }

        const allBlogs = [];
        const userSnapshot = await db.ref(`users/${currentUserId}/following`).once("value");
        const following = userSnapshot.exists() ? Object.keys(userSnapshot.val()) : [];

        const sortedKeys = Object.keys(blogs).sort((a, b) => blogs[b].timestamp - blogs[a].timestamp);

        for (let key of sortedKeys) {
          const blog = blogs[key];
          const authorSnapshot = await db.ref("users/" + blog.uid).once("value");
          const authorName = authorSnapshot.exists() ? authorSnapshot.val().username : "Unknown";

          const likes = blog.likes || {};
          const comments = blog.comments || {};
          const likeCount = Object.keys(likes).length;
          const hasLiked = likes[currentUserId];
          const isFollowing = following.includes(blog.uid);

          let commentsHTML = Object.values(comments).map(c => 
  `<div class='comment'><span class='comment-username'>${c.username}</span>: ${c.text}</div>`).join('');


          const followBtn = blog.uid !== currentUserId
            ? `<button onclick="toggleFollow('${blog.uid}')">${isFollowing ? 'Unfollow' : 'Follow'}</button>`
            : "";

         const blogHTML = `
<div class='blog-box' style="position: relative;">
  <div class="blog-content">
    <h4>${blog.title}</h4>
    <p>${blog.content}</p>
    <small>Author: <a href="user.html?uid=${blog.uid}&username=${authorName}" style="color: #03dac5; text-decoration: none;">${authorName}</a></small>
    <div class="button-row">
      <div class="like-circle" onclick="toggleLike('${key}')" id="like-btn-${key}" title="Like">
        <img src="${hasLiked ? 'https://img.icons8.com/ios-filled/50/love-circled.png' : 'https://img.icons8.com/ios/50/love-circled.png'}" class="like-icon"/>
        <span id="like-count-${key}" style="position: absolute; color: black; font-size: 10px; font-weight: bold;">${likeCount}</span>
      </div>

 ${blog.uid === currentUserId ? ` 
          <div class="delete-btn" onclick="deleteBlog('${key}')" title="Delete"><img src="https://img.icons8.com/material-rounded/40/filled-trash.png" /></div>
        ` : `
          <button class="follow-btn" onclick="toggleFollow('${blog.uid}')">
            ${isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        `}
      
      <button class="share-btn" onclick="openShareModal('${key}')" title="Share"><img src="https://img.icons8.com/material-sharp/24/share.png"/></button>
    </div>
      <hr/>
      <div class="comment-section">
        <input type="text" id="comment-input-${key}" placeholder="Add a comment..." />
        <button onclick="postComment('${key}')">Post</button>
      </div>
    </div>

    <div class="comment-list">
      ${commentsHTML || '<div class="comment">No comments yet.</div>'}
    </div>
  </div>`;


          allBlogs.push(blogHTML);
        }

        document.getElementById("blog-section").innerHTML = allBlogs.join("");
      });
    }

   function postComment(blogId) {
      const commentInput = document.getElementById(`comment-input-${blogId}`);
      const commentText = commentInput.value.trim();
      if (!commentText) return;

      const commentRef = db.ref(`blogs/${blogId}/comments`).push();
      commentRef.set({
        uid: currentUserId,
        username: currentUsername,
        text: commentText,
        timestamp: Date.now()
      }).then(() => {
        commentInput.value = '';
      });
    }
  function toggleFollow(targetUserId) {
  const followRef = db.ref(`users/${currentUserId}/following/${targetUserId}`);
  followRef.once("value").then(snapshot => {
    const buttons = document.querySelectorAll(`button[onclick="toggleFollow('${targetUserId}')"]`);
    if (snapshot.exists()) {
      followRef.remove().then(() => {
        buttons.forEach(btn => btn.innerText = 'Follow');
      });
    } else {
      followRef.set(true).then(() => {
        buttons.forEach(btn => btn.innerText = 'Unfollow');
      });
    }
  });
}

  function toggleLike(blogId) {
  const likeRef = db.ref("blogs/" + blogId + "/likes/" + currentUserId);
  const likeIcon = document.querySelector(`#like-btn-${blogId} .like-icon`);
  const likeCountSpan = document.getElementById("like-count-" + blogId);

  likeRef.once("value").then(snapshot => {
    let count = parseInt(likeCountSpan.innerText);
    if (snapshot.exists()) {
      likeRef.remove(); // Unlike
      likeIcon.src = "https://img.icons8.com/ios/50/love-circled.png";
      likeCountSpan.innerText = Math.max(0, count - 1);
    } else {
      likeRef.set(true); // Like
      likeIcon.src = "https://img.icons8.com/ios-filled/50/love-circled.png";
      likeCountSpan.innerText = count + 1;
    }
  });
}
function deleteBlog(blogId) {
  if (confirm("Are you sure you want to delete this blog?")) {
    db.ref("blogs/" + blogId).remove().then(() => {
      loadOwnBlogs();
    });
  }
}
function openShareModal(blogId) {
  blogToShareId = blogId;
  document.getElementById("shareModal").style.display = "block";
  loadUsersForSharing();
}

function closeShareModal() {
  document.getElementById("shareModal").style.display = "none";
  document.getElementById("shareUserList").innerHTML = ""; // Clear previous list
}

let currentUserId = "";
let currentUsername = "";
let blogToShareId = "";

function loadUsersForSharing() {
  const shareUserList = document.getElementById("shareUserList");
  db.ref("users").once("value", (snapshot) => {
    shareUserList.innerHTML = "";
    snapshot.forEach((userSnap) => {
      const userId = userSnap.key;
      const userData = userSnap.val();
      if (userId !== currentUserId) {
        const userDiv = document.createElement("div");
        userDiv.style.padding = "10px";
        userDiv.style.borderBottom = "1px solid #555";
        userDiv.style.cursor = "pointer";
        userDiv.innerHTML = `
          <strong>${userData.username || "Unnamed User"}</strong>
          <button style="float:right; padding:4px 8px; border:none; border-radius:5px; background:#03dac5; color:black; cursor:pointer;"
            onclick="shareBlogWithUser('${userId}', '${userData.username}')">Send</button>
        `;
        shareUserList.appendChild(userDiv);
      }
    });
  });
}


function shareBlogWithUser(receiverId, receiverUsername) {
  const timestamp = new Date().getTime();
  const chatId = currentUserId < receiverId ? currentUserId + receiverId : receiverId + currentUserId;

  db.ref("blogs/" + blogToShareId).once("value", (snap) => {
    if (snap.exists()) {
      const blog = snap.val();
      const messageData = {
        type: "blog",
        blogId: blogToShareId,
        senderId: currentUserId,
        senderUsername: currentUsername,
        timestamp: timestamp
      };
      db.ref(`chats/${chatId}/messages`).push(messageData).then(() => {
        alert(`Blog shared with ${receiverUsername}`);
        closeShareModal();
      });
    }
  });
}
function fetchNotes() {
  
  const notesBar = document.getElementById("notes-bar");
  notesBar.innerHTML = "";

  db.ref("notes").once("value").then(snapshot => {
    const notes = [];

    snapshot.forEach(child => {
      const note = child.val();
      note.id = child.key;
      if (Date.now() - note.timestamp <= 86400000) {
        notes.push(note);
      } else {
        // Remove expired note
        db.ref("notes/" + child.key).remove();
      }
    });

    // Sort notes by timestamp descending (latest first)
    notes.sort((a, b) => b.timestamp - a.timestamp);

    notes.forEach(note => {
      const noteCard = document.createElement("div");
      noteCard.style.display = "inline-block";
      noteCard.style.background = "#03dac5";
      noteCard.style.color = "#000";
      noteCard.style.padding = "6px";
      noteCard.style.borderRadius = "10px";
      noteCard.style.width = "90px";
      noteCard.style.height = "90px";
      noteCard.style.overflow = "hidden";
      noteCard.style.whiteSpace = "normal";
      noteCard.style.position = "relative";
      noteCard.style.fontSize = "15px";

      noteCard.innerHTML = `
  <a href="user.html?uid=${note.uid}" style="color: black; text-decoration: none; font-weight: bold;">
    ${note.username}
  </a><br/>
  <small>${new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
  <p style="margin-top:4px;">${note.text}</p>
`;
      if (note.uid === currentUserId) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "x";
        deleteBtn.style.display = "flex";
deleteBtn.style.alignItems = "center";
deleteBtn.style.justifyContent = "center";
        deleteBtn.title = "Delete Note";
        deleteBtn.style.position = "absolute";
        deleteBtn.style.top = "5px";
        deleteBtn.style.right = "5px";
        deleteBtn.style.background = "black";
        deleteBtn.style.color = "#fff";
        deleteBtn.style.border = "none";
        deleteBtn.style.borderRadius = "50%";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "10px";
        deleteBtn.style.width = "20px";
        deleteBtn.style.height = "20px";
        deleteBtn.onclick = () => {
          if (confirm("Are you sure you want to delete this note?")) {
            db.ref("notes/" + note.id).remove().then(fetchNotes);
          }
        };
        noteCard.appendChild(deleteBtn);
      }

      notesBar.appendChild(noteCard);
    });
  });
}


function updateNoteCharCount() {
  const input = document.getElementById("noteInput");
  const count = input.value.length;
  document.getElementById("charCount").textContent = `${count}/100`;
}

function postNote() {
  const text = document.getElementById("noteInput").value.trim();
  if (!text) return alert("Note cannot be empty!");

  const noteRef = db.ref("notes").push();
  noteRef.set({
    uid: currentUserId,
    username: currentUsername,
    text,
    timestamp: Date.now()
  }).then(() => {
    document.getElementById("noteInput").value = "";
    fetchNotes(); // refresh notes immediately
  });
}
function shareBlogWithUser(uid, username) {
  db.ref(`blogs/${blogToShareId}`).once("value").then(blogSnap => {
    if (!blogSnap.exists()) return;

    const blog = blogSnap.val();
    const chatId = [currentUserId, uid].sort().join("_");

    const message = `📢 <b>${currentUsername}</b> shared a blog:\n\n<b>${blog.title}</b>\n${blog.content}\n\n👉 <a href="singleblog.html?blogId=${blogToShareId}">View Blog</a>`;

    db.ref(`chats/${chatId}`).push({
      senderId: currentUserId,
      senderName: currentUsername,
      message: message,
      timestamp: Date.now()
    }).then(() => {
      closeShareModal();
      alert(`Shared with ${username}`);
    });
  });
}

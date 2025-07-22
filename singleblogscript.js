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
    const db = firebase.database();
    const auth = firebase.auth();
    const blogContainer = document.getElementById("blogContainer");
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get("blogId");

    if (!blogId) {
      blogContainer.innerHTML = "<p>Invalid blog link.</p>";
      throw new Error("Missing blogId");
    }

    auth.onAuthStateChanged(user => {
      if (!user) {
        blogContainer.innerHTML = "<p>Please login to view this blog.</p>";
        return;
      }

      const currentUserId = user.uid;

      db.ref(`blogs/${blogId}`).once("value").then(async snapshot => {
        if (!snapshot.exists()) {
          blogContainer.innerHTML = "<p>Blog not found.</p>";
          return;
        }

        const blog = snapshot.val();
        const { title, content, uid, timestamp, likes = {}, comments = {} } = blog;
        const likeCount = Object.keys(likes).length;
        const hasLiked = !!likes[currentUserId];

        const userSnap = await db.ref(`users/${uid}`).once("value");
        const username = userSnap.exists() ? userSnap.val().username : "Unknown";
        const isFollowingSnap = await db.ref(`users/${currentUserId}/following/${uid}`).once("value");
        const isFollowing = isFollowingSnap.exists();
        const time = timestamp ? new Date(timestamp).toLocaleString() : "";

        const commentsHTML = Object.values(comments).map(c =>
          `<div class='comment'><span class='comment-username'>${c.username}</span>: ${c.text}</div>`
        ).join('');

        blogContainer.innerHTML = `
        <div class='blog-box' style="position: relative;">
          <div class="blog-content">
            <h4>${title}</h4>
            <p>${content}</p>
            <small>Author: <a href="user.html?uid=${uid}&username=${username}" style="color: #03dac5; text-decoration: none;">${username}</a>   ${time}</small>
             
            <div class="button-row">
              <div class="like-circle" onclick="toggleLike('${blogId}')" id="like-btn-${blogId}" title="Like">
                <img src="${hasLiked ? 'https://img.icons8.com/ios-filled/50/love-circled.png' : 'https://img.icons8.com/ios/50/love-circled.png'}" class="like-icon"/>
                <span id="like-count-${blogId}" style="position: absolute; color: black; font-size: 10px; font-weight: bold;">${likeCount}</span>
              </div>
${uid !== currentUserId ? `
  <button class="follow-btn" onclick="toggleFollow('${uid}')">
    ${isFollowing ? 'Unfollow' : 'Follow'}
  </button>` : ''}
<div class="share-btn" onclick="openShareModal('${blogId}')"><img src="https://img.icons8.com/flat-round/30/share--v1.png"/></div>
 
            </div>
            <hr/>
            <div class="comment-section">
              <input type="text" id="comment-input-${blogId}" placeholder="Add a comment..." />
              <button onclick="postComment('${blogId}')">Post</button>
            </div>
            <div class="comment-list">
              ${commentsHTML || '<div class="comment">No comments yet.</div>'}
            </div>
          </div>
        </div>`;
      });
    });

    function toggleLike(blogId) {
      const likeRef = firebase.database().ref(`blogs/${blogId}/likes/${firebase.auth().currentUser.uid}`);
      const likeIcon = document.querySelector(`#like-btn-${blogId} .like-icon`);
      const likeCountSpan = document.getElementById(`like-count-${blogId}`);
      let count = parseInt(likeCountSpan.innerText);

      likeRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
          likeRef.remove();
          likeIcon.src = "https://img.icons8.com/ios/50/love-circled.png";
          likeCountSpan.innerText = Math.max(0, count - 1);
        } else {
          likeRef.set(true);
          likeIcon.src = "https://img.icons8.com/ios-filled/50/love-circled.png";
          likeCountSpan.innerText = count + 1;
        }
      });
    }

    function toggleFollow(targetUserId) {
      const currentUserId = firebase.auth().currentUser.uid;
      const followRef = firebase.database().ref(`users/${currentUserId}/following/${targetUserId}`);
      followRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
          followRef.remove().then(() => location.reload());
        } else {
          followRef.set(true).then(() => location.reload());
        }
      });
    }

    function postComment(blogId) {
      const commentInput = document.getElementById(`comment-input-${blogId}`);
      const commentText = commentInput.value.trim();
      if (!commentText) return;

      const commentRef = firebase.database().ref(`blogs/${blogId}/comments`).push();
      const currentUser = firebase.auth().currentUser;

      firebase.database().ref(`users/${currentUser.uid}/username`).once("value")
        .then(usernameSnap => {
          const username = usernameSnap.exists() ? usernameSnap.val() : "Unknown";
          commentRef.set({
            uid: currentUser.uid,
            username: username,
            text: commentText,
            timestamp: Date.now()
          }).then(() => {
            commentInput.value = '';
            location.reload();
          });
        });
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

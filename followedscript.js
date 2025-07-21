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
      if (!user) return window.location = 'index.html';
      currentUserId = user.uid;
      // fetch username for comment and follow use
      db.ref(`users/${currentUserId}/username`).once('value').then(s => {
        currentUsername = s.val() || 'User';
        loadProfileData();
        loadOwnBlogs();
        loadFollowedBlogs();
      });
    });
function loadProfileData() {
  const uRef = db.ref(`users/${currentUserId}`);
  uRef.once('value').then(snap => {
    const user = snap.val() || {};
    document.getElementById('username-display').innerText = user.username || 'User';
  });

  // followers
  db.ref(`users/${currentUserId}/followers`).once('value').then(snap => {
    const followers = snap.val() || {};
    document.getElementById('followers-count').innerText = Object.keys(followers).length;
    let html = '';
    Object.keys(followers).forEach(uid => {
      db.ref(`users/${uid}/username`).once('value').then(ns => {
        const name = ns.val() || 'User';
        html += `<p><a href="user.html?uid=${uid}">${name}</a></p>`; // ⬅️ clickable link
        document.getElementById('followers-list').innerHTML = html;
      });
    });
  });

  // following
  db.ref(`users/${currentUserId}/following`).once('value').then(snap => {
    const following = snap.val() || {};
    document.getElementById('following-count').innerText = Object.keys(following).length;
    let html = '';
    Object.keys(following).forEach(uid => {
      db.ref(`users/${uid}/username`).once('value').then(ns => {
        const name = ns.val() || 'User';
        html += `<p><a href="user.html?uid=${uid}">${name}</a></p>`; // ⬅️ clickable link
        document.getElementById('following-list').innerHTML = html;
      });
    });
  });
}


     function initProfileListeners() {
      // Real-time updates for followers
      db.ref(`users/${currentUserId}/followers`).on('value', snap => {
        const followers = snap.val() || {};
        document.getElementById('followers-count').innerText = Object.keys(followers).length;
        let html = '';
        Object.keys(followers).forEach(uid => {
          html += `<p id="follower-${uid}">Loading...</p>`;
          db.ref(`users/${uid}/username`).once('value').then(ns => {
            const p = document.getElementById(`follower-${uid}`);
            if (p) p.innerText = ns.val() || 'User';
          });
        });
        document.getElementById('followers-list').innerHTML = html;
      });
      // Real-time updates for following
      db.ref(`users/${currentUserId}/following`).on('value', snap => {
        const following = snap.val() || {};
        document.getElementById('following-count').innerText = Object.keys(following).length;
        let html = '';
        Object.keys(following).forEach(uid => {
          html += `<p id="following-${uid}">Loading...</p>`;
          db.ref(`users/${uid}/username`).once('value').then(ns => {
            const p = document.getElementById(`following-${uid}`);
            if (p) p.innerText = ns.val() || 'User';
          });
        });
        document.getElementById('following-list').innerHTML = html;
      });
    }

    function toggleList(type) {
      const listEl = document.getElementById(`${type}-list`);
      listEl.style.display = listEl.style.display === 'block' ? 'none' : 'block';
    }

    function toggleFollow(targetUserId) {
      const followRef = db.ref(`users/${currentUserId}/following/${targetUserId}`);
      const followerRef = db.ref(`users/${targetUserId}/followers/${currentUserId}`);
      followRef.once('value').then(snap => {
        if (snap.exists()) {
          followRef.remove();
          followerRef.remove();
        } else {
          followRef.set(true);
          followerRef.set(true);
        }
      });
    }

    
function generateBlogCard(blog, key, authorName = 'You', isOwn = false) {
      const comments = blog.comments || {};
      const commentsHTML = Object.values(comments).map(c =>
        `<div class="comment"><span class="comment-username">${c.username || 'User'}</span>: ${c.text}</div>`
      ).join('') || `<div class="comment">No comments yet.</div>`;

      return `
        <div class="blog-card" data-id="${key}" style="position: relative;">
          <h4>${blog.title}</h4>
          <p>${blog.content}</p>
          <small>${authorName}</small>
  <div class="blog-actions">

     <div class="blog-actions-right">
    <div class="icon-btn" onclick="toggleLike('${key}')" title="Like" >
      <img id="like-icon-${key}" src="${blog.likes && blog.likes[currentUserId] ? 'https://img.icons8.com/ios-filled/50/love-circled.png' : 'https://img.icons8.com/ios/50/love-circled.png'}" />
      <div class="like-count-overlay" id="like-count-${key}">
        ${(blog.likes ? Object.keys(blog.likes).length : 0)}
      </div>
    </div>
      <div class="share-btn" onclick="openShareModal('${key}')" title="Share"><img src="https://img.icons8.com/material-sharp/24/share.png"/></div>
    <div class="icon-btn" onclick="toggleComments('${key}')" title="Comment">
      <img src="https://img.icons8.com/ios-glyphs/40/speech-bubble.png" />
    </div>
  </div>
  <div class="blog-actions-left">
    ${isOwn ? `
      <div class="icon-btn" onclick="enableEdit('${key}')" title="Edit">
        <img src="https://img.icons8.com/material/40/create-new.png" />
      </div>
      <div class="icon-btn" onclick="deleteBlog('${key}')" title="Delete">
        <img src="https://img.icons8.com/material-rounded/40/filled-trash.png" />
      </div>
    ` : ''}
  </div>
 
</div>

          <div class="comments" id="comments-${key}" style="display:none;">
            <div class="comment-section">
              <input type="text" id="comment-input-${key}" placeholder="Write a comment..." />
              <button onclick="postComment('${key}')">Post</button>
            </div>
            <div class="comment-list" id="comment-list-${key}">
              ${commentsHTML}
            </div>
          </div>
        </div>
      `;
    }

   function loadOwnBlogs() {
  db.ref("blogs").orderByChild("uid").equalTo(currentUserId).once("value").then(snapshot => {
    const blogs = snapshot.val();
    let output = "";

    if (blogs) {
      for (let key in blogs) {
        output += generateBlogCard(blogs[key], key, "You", true);
      }
    } else {
      output = "<p>You haven't posted any blogs yet.</p>";
    }

    document.getElementById("own-blogs").innerHTML = output;
  });
}

    function loadFollowedBlogs() {
      db.ref("users/" + currentUserId + "/following").once("value").then(snapshot => {
        const following = snapshot.val();
        if (!following) {
          document.getElementById("followed-blogs").innerHTML = "<p>You are not following anyone.</p>";
          return;
        }

        const followedIds = Object.keys(following);
        let blogPromises = followedIds.map(uid => {
          return Promise.all([
            db.ref("blogs").orderByChild("uid").equalTo(uid).once("value"),
            db.ref("users/" + uid + "/username").once("value")
          ]).then(([blogSnap, usernameSnap]) => {
            return {
              uid,
              username: usernameSnap.val() || "Unknown",
              blogs: blogSnap.val()
            };
          });
        });

        Promise.all(blogPromises).then(results => {
          let output = "";
          results.forEach(result => {
            const blogs = result.blogs;
            const authorName = result.username;
           if (blogs) {
  for (let key in blogs) {
    output += generateBlogCard(blogs[key], key, authorName, false);
  }
}

              }
            
          );

          if (output === "") {
            output = "<p>No blogs from followed users yet.</p>";
          }

          document.getElementById("followed-blogs").innerHTML = output;
        });
      });
    }

    function showTab(tab) {
      const own = document.getElementById("own-blogs");
      const followed = document.getElementById("followed-blogs");
      const tabs = document.querySelectorAll(".tab-title");

      if (tab === 'own') {
        own.classList.add("active-tab");
        followed.classList.remove("active-tab");
        tabs[0].classList.add("active");
        tabs[1].classList.remove("active");
      } else {
        followed.classList.add("active-tab");
        own.classList.remove("active-tab");
        tabs[1].classList.add("active");
        tabs[0].classList.remove("active");
      }
    }
    function toggleLike(blogId) {
  const likeRef = db.ref("blogs/" + blogId + "/likes/" + currentUserId);
  likeRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      likeRef.remove(); // Unlike
      document.getElementById("like-icon-" + blogId).src = "https://img.icons8.com/ios/50/love-circled.png";
    } else {
      likeRef.set(true); // Like
      document.getElementById("like-icon-" + blogId).src = "https://img.icons8.com/ios-filled/50/love-circled.png";
    }
  }).then(() => {
    updateLikeCount(blogId);
  });
}


function updateLikeCount(blogId) {
  db.ref("blogs/" + blogId + "/likes").once("value").then(snapshot => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById("like-count-" + blogId).innerText = count;
  });
}


function toggleComments(blogId) {
  const commentDiv = document.getElementById("comments-" + blogId);
  commentDiv.style.display = commentDiv.style.display === "none" ? "block" : "none";
  loadComments(blogId);
}

function postComment(blogId) {
      const input = document.getElementById(`comment-input-${blogId}`);
      const text = input.value.trim();
      if (!text) return;
      const commentRef = db.ref(`blogs/${blogId}/comments`).push();
      commentRef.set({
        uid: currentUserId,
        username: currentUsername,
        text,
        timestamp: Date.now()
      }).then(() => {
        input.value = '';
        loadComments(blogId);
      });
    }

function loadComments(blogId) {
      db.ref(`blogs/${blogId}/comments`).orderByChild('timestamp').once('value').then(snap => {
        const list = document.getElementById(`comment-list-${blogId}`);
        let html = '';
        snap.forEach(cSnap => {
          const c = cSnap.val();
          html += `<div class="comment"><span class="comment-username">${c.username}</span>: ${c.text}</div>`;
        });
        list.innerHTML = html || `<div class="comment">No comments yet.</div>`;
      });
    }
function enableEdit(blogId) {
  const blogCard = document.querySelector(`.blog-card[data-id="${blogId}"]`);
  const title = blogCard.querySelector("h4");
  const content = blogCard.querySelector("p");

  if (title.isContentEditable) {
    db.ref("blogs/" + blogId).update({
      title: title.innerText,
      content: content.innerText
    });
    title.contentEditable = "false";
    content.contentEditable = "false";
  } else {
    title.contentEditable = "true";
    content.contentEditable = "true";
    title.focus();
  }
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

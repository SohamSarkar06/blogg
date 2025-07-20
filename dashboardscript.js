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
  <div class='blog-box'>
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



function updateLikeCount(blogId) {
  db.ref("blogs/" + blogId + "/likes").once("value").then(snapshot => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById("like-count-" + blogId).innerText = count;
  });
}


    function deleteBlog(blogId) {
      if (confirm("Are you sure you want to delete this blog?")) {
        db.ref("blogs/" + blogId).remove();
      }
    }

    function goToChat() {
      location.href = `chat.html?uid=${currentUserId}&username=${encodeURIComponent(currentUsername)}`;
    }
   function goToFollowedBlogs() {
    location.href = `followed.html`;
  }

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
    let currentUsername = "";

    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    if (!uid) {
      document.body.innerHTML = "<p>User ID not found in URL.</p>";
      throw new Error("Missing UID");
    }

    db.ref("users/" + uid).once("value").then(snapshot => {
      const user = snapshot.val();
      document.getElementById("username").innerText = user.username || "Unknown";
      currentUsername = user.username;
    });
     const likedBlogs = {};

  function isLiked(blogId) {
    return likedBlogs[blogId];
  }


    db.ref("users/" + uid + "/following").once("value").then(snapshot => {
      const following = snapshot.val() || {};
      document.getElementById("following-count").innerText = Object.keys(following).length;

      let list = "";
      for (let id in following) {
        db.ref("users/" + id + "/username").once("value").then(nameSnap => {
          list += `<p><a href="user.html?uid=${id}" style="color:#ccc;">${nameSnap.val() || "Unknown"}</a></p>`;
          document.getElementById("following-list").innerHTML = list;
        });
      }
    });

    document.getElementById("following-tab").addEventListener("click", () => {
      const list = document.getElementById("following-list");
      list.style.display = list.style.display === "none" ? "block" : "none";
    });

    function toggleLike(blogId) {
    const ref = db.ref(`blogs/${blogId}/likes/${uid}`);
    ref.once("value").then(snap => {
      if (snap.exists()) {
        ref.remove();
        likedBlogs[blogId] = false;
      } else {
        ref.set(true);
        likedBlogs[blogId] = true;
      }
    }).then(() => updateLikeCount(blogId));
  }
    function updateLikeCount(blogId) {
    db.ref(`blogs/${blogId}/likes`).once("value").then(snap => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 0;
      document.getElementById(`like-count-${blogId}`).innerText = count;
      const img = document.getElementById(`like-icon-${blogId}`);
      if (snap.hasChild(uid)) {
        likedBlogs[blogId] = true;
        img.src = "https://img.icons8.com/ios-filled/50/love-circled.png";
      } else {
        likedBlogs[blogId] = false;
        img.src = "https://img.icons8.com/ios/50/love-circled.png";
      }
    });
  }

    function toggleComments(blogId) {
      const section = document.getElementById(`comments-${blogId}`);
      section.style.display = section.style.display === "none" ? "block" : "none";
      loadComments(blogId);
    }

    function postComment(blogId) {
      const input = document.getElementById(`comment-input-${blogId}`);
      const text = input.value.trim();
      if (!text) return;
      const ref = db.ref(`blogs/${blogId}/comments`).push();
      ref.set({ uid, username: currentUsername, text, timestamp: Date.now() })
        .then(() => { input.value = ''; loadComments(blogId); });
    }

    function loadComments(blogId) {
      db.ref(`blogs/${blogId}/comments`).orderByChild("timestamp").once("value").then(snap => {
        const list = document.getElementById(`comment-list-${blogId}`);
        let html = "";
        snap.forEach(c => {
          const data = c.val();
          html += `<div class='comment'><span class='comment-username'>${data.username}</span>: ${data.text}</div>`;
        });
        list.innerHTML = html || "<div class='comment'>No comments yet.</div>";
      });
    }

    db.ref("blogs").orderByChild("uid").equalTo(uid).once("value").then(snapshot => {
    const blogs = snapshot.val() || {};
    let output = "";
    for (let key in blogs) {
      const blog = blogs[key];
      output += `
        <div class="blog">
          <h3>${blog.title}</h3>
          <p>${blog.content}</p>
          <div class="blog-actions">
            <div class="action-circle" onclick="toggleLike('${key}')" title="Like" >
              <img id="like-icon-${key}" src="https://img.icons8.com/ios/50/love-circled.png" />
          <span id="like-count-${key}" style="position: absolute; color: black; font-size: 10px; font-weight: bold;">0</span>

            </div>
            <div class="action-circle" onclick="toggleComments('${key}')" title="Comment">
              <img src="https://img.icons8.com/ios-glyphs/100/speech-bubble.png"/>
            </div>
          </div>
          <div class="comments" id="comments-${key}">
            <div class="comment-section">
              <input type="text" id="comment-input-${key}" placeholder="Write a comment...">
              <button onclick="postComment('${key}')">Post</button>
            </div>
            <hr/>
            <div class="comment-list" id="comment-list-${key}"></div>
          </div>
        </div>`;
    }
    document.getElementById("blog-list").innerHTML = output || "<p>No blogs yet.</p>";

    for (let key in blogs) {
      updateLikeCount(key);
    }
  });

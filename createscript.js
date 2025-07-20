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

    auth.onAuthStateChanged(user => {
      if (user) {
        currentUserId = user.uid;
      } else {
        alert("You must be logged in.");
        window.location.href = "index.html";
      }
    });

    function postBlog() {
      const title = document.getElementById("blog-title").value.trim();
      const content = document.getElementById("blog-content").value.trim();
      if (!title || !content) {
        alert("Title and content required");
        return;
      }
      const blogId = db.ref("blogs").push().key;
      db.ref("blogs/" + blogId).set({
        uid: currentUserId,
        title,
        content,
        timestamp: Date.now()
      }).then(() => {
        alert("Blog posted!");
        window.location.href = "dashboard.html";
      });
    }
     function goToChat() {
      location.href = `chat.html?uid=${currentUserId}&username=${encodeURIComponent(currentUsername)}`;
    }
   function goToFollowedBlogs() {
    location.href = `followed.html`;
     
  }
    function logout() {
       location.href = `index.html?uid=${currentUserId}&username=${encodeURIComponent(currentUsername)}`;
      }

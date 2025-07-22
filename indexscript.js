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

    function toggleAuthForm(form) {
      document.getElementById("login-form").classList.toggle("hidden", form !== "login");
      document.getElementById("signup-form").classList.toggle("hidden", form !== "signup");
      document.getElementById("dashboard-btn").style.display = "none";
    }

function signup() {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      user.sendEmailVerification()
        .then(() => {
          alert("✅ Verification email sent. Please check your inbox (or spam) and verify before logging in.");
          auth.signOut();
          toggleAuthForm('login');
        })
        .catch((err) => {
          alert("Failed to send verification email: " + err.message);
        });
    })
    .catch((error) => {
      if (error.code === 'auth/email-already-in-use') {
        alert("Email already in use. Please log in instead.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Invalid email format.");
      } else if (error.code === 'auth/weak-password') {
        alert("Password too weak. Use at least 6 characters.");
      } else {
        alert("Signup error: " + error.message);
      }
    });
}

    function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.emailVerified) {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      } else {
        alert("Please verify your email before logging in.");
        auth.signOut();
      }
    })
    .catch((error) => {
      alert("Login error: " + error.message);
    });
}


    function goToDashboard() {
  window.location.href = "dashboard.html";
}

    window.onload = () => {
  toggleAuthForm('login');
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        window.location.href = "dashboard.html";
      }
    }
  });
};

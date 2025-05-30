// Firebase configuration e inicialización
const firebaseConfig = {
  apiKey: "AIzaSyCbzr1wbKl_nPNhUkEzNjXtI3qa5eKpj9s",
  authDomain: "comic-c90b7.firebaseapp.com",
  projectId: "comic-c90b7",
  storageBucket: "comic-c90b7.firebasestorage.app",
  messagingSenderId: "1081204746435",
  appId: "1:1081204746435:web:5dbc652d221ef4f413da76",
  measurementId: "G-0RB75CQFVT"
};

firebase.initializeApp(firebaseConfig);

let user = null;
let comicsCollection = new ComicsCollection();
let favoritesCollection = null;

const comicsListView = new ComicsListView({ collection: comicsCollection });
const comicDetailView = new ComicDetailView();
let favoritesListView = null;

function loadComics(query = "") {
  fetchComics(query).then(comics => {
    comicsCollection.reset(comics);
  });
}

$("#search").on("input", function () {
  const query = $(this).val().trim();
  loadComics(query);
});

$("#btn-comics").click(() => {
  $("#comic-list").show();
  $("#favorites-list").hide();
  $("#search").show();
  $("#btn-comics").addClass("active");
  $("#btn-favorites").removeClass("active");
});

$("#btn-favorites").click(() => {
  if (!user) {
    alert("Debes iniciar sesión para ver favoritos.");
    return;
  }
  $("#comic-list").hide();
  $("#favorites-list").show();
  $("#search").hide();
  $("#btn-favorites").addClass("active");
  $("#btn-comics").removeClass("active");
});

$("#login-btn").click(() => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      user = result.user;
      $("#user-info").text(user.displayName);
      $("#login-btn").hide();
      $("#logout-btn").show();

      favoritesCollection = new FavoritesCollection(user.uid);
      favoritesListView = new FavoritesListView({ collection: favoritesCollection });

      comicsListView.favorites = favoritesCollection;
      comicsListView.render();

    }).catch(err => {
      console.error(err);
      alert("Error en el login.");
    });
});

$("#logout-btn").click(() => {
  firebase.auth().signOut().then(() => {
    user = null;
    $("#user-info").text("");
    $("#login-btn").show();
    $("#logout-btn").hide();
    favoritesCollection = null;
    favoritesListView && favoritesListView.collection.reset();
    comicsListView.favorites = null;
    comicsListView.render();

    $("#btn-comics").click();
  });
});

// Inicialización inicial
loadComics();

// Config Firebase (tu configuración aquí)
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
const auth = firebase.auth();
const db = firebase.firestore();

// Marvel API keys (tu configuración)
const publicKey = "55e32c33fc52b6cb15859f117b7df89b";
const ts = "1";
const hash = "6236f41a16f9285e016ddb3bb1dfb522";

// Selectores jQuery
const searchInput = $("#search");
const comicList = $("#comic-list");
const favoritesList = $("#favorites-list");
const comicDetail = $("#comic-detail");
const userInfo = $("#user-info");
const loginBtn = $("#login-btn");
const logoutBtn = $("#logout-btn");
const btnComics = $("#btn-comics");
const btnFavorites = $("#btn-favorites");

// Backbone Models y Collections

const Comic = Backbone.Model.extend({});

const ComicsCollection = Backbone.Collection.extend({
  model: Comic
});

const Favorite = Backbone.Model.extend({
  idAttribute: "id"
});

const FavoritesCollection = Backbone.Collection.extend({
  model: Favorite,

  initialize(userId) {
    this.userId = userId;
    this.unsubscribe = null;
    this.fetchFavorites();
  },

  fetchFavorites() {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = db
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .onSnapshot(snapshot => {
        const favs = [];
        snapshot.forEach(doc => {
          favs.push({ id: doc.id, ...doc.data() });
        });
        this.reset(favs);
      });
  },

  addFavorite(comic) {
    return db
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .doc(comic.get("id").toString())
      .set(comic.toJSON());
  },

  removeFavorite(comicId) {
    return db
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .doc(comicId.toString())
      .delete();
  },

  isFavorite(comicId) {
    return this.some(fav => fav.get("id") === comicId);
  }
});

// Vistas Backbone

// Vista lista cómics
const ComicsListView = Backbone.View.extend({
  el: comicList,

  initialize(options) {
    this.collection = options.collection;
    this.favorites = options.favorites;
    this.listenTo(this.collection, "reset", this.render);
    this.listenTo(this.favorites, "update reset add remove", this.render);
  },

  events: {
    "click .comic": "onComicClick",
    "click .fav-btn": "onFavClick"
  },

  render() {
    this.$el.empty();
    if (this.collection.length === 0) {
      this.$el.html("<p>No se encontraron cómics.</p>");
      return this;
    }

    this.collection.each(comic => {
      const isFav = this.favorites && this.favorites.isFavorite(comic.get("id"));
      const thumbnail = `${comic.get("thumbnail").path}.${comic.get("thumbnail").extension}`;

      this.$el.append(`
        <div class="comic" data-id="${comic.get("id")}">
          <h3>${comic.get("title")}</h3>
          <img src="${thumbnail}" alt="${comic.get("title")}" />
          <button class="fav-btn">${isFav ? "★ Quitar favorito" : "☆ Agregar favorito"}</button>
        </div>
      `);
    });

    return this;
  },

  onComicClick(e) {
    if ($(e.target).hasClass("fav-btn")) return;
    const id = $(e.currentTarget).data("id");
    const comic = this.collection.get(id);
    comicDetailView.show(comic);
  },

  onFavClick(e) {
    e.stopPropagation();
    if (!favoritesCollection) return alert("Inicia sesión para usar favoritos.");

    const $btn = $(e.currentTarget);
    const $comicDiv = $btn.closest(".comic");
    const comicId = $comicDiv.data("id");
    const comic = this.collection.get(comicId);

    if (favoritesCollection.isFavorite(comicId)) {
      favoritesCollection.removeFavorite(comicId);
    } else {
      favoritesCollection.addFavorite(comic);
    }
  }
});

// Vista lista favoritos
const FavoritesListView = Backbone.View.extend({
  el: favoritesList,

  initialize(options) {
    this.collection = options.collection;
    this.listenTo(this.collection, "reset update add remove", this.render);
  },

  events: {
    "click .favorite": "onFavoriteClick",
    "click .fav-btn": "onFavClick"
  },

  render() {
    this.$el.empty();
    if (this.collection.length === 0) {
      this.$el.html("<p>No tienes favoritos guardados.</p>");
      return this;
    }

    this.collection.each(fav => {
      const thumbnail = `${fav.get("thumbnail").path}.${fav.get("thumbnail").extension}`;

      this.$el.append(`
        <div class="favorite" data-id="${fav.get("id")}">
          <h3>${fav.get("title")}</h3>
          <img src="${thumbnail}" alt="${fav.get("title")}" />
          <button class="fav-btn">★ Quitar favorito</button>
        </div>
      `);
    });

    return this;
  },

  onFavoriteClick(e) {
    if ($(e.target).hasClass("fav-btn")) return;
    const id = $(e.currentTarget).data("id");
    const comic = this.collection.get(id);
    comicDetailView.show(comic);
  },

  onFavClick(e) {
    e.stopPropagation();
    const $btn = $(e.currentTarget);
    const $favDiv = $btn.closest(".favorite");
    const favId = $favDiv.data("id");
    favoritesCollection.removeFavorite(favId);
  }
});

// Vista detalle cómic
const ComicDetailView = Backbone.View.extend({
  el: comicDetail,

  events: {
    "click #back-btn": "onBack"
  },

  show(comic) {
    this.$el.show();
    searchInput.hide();
    comicList.hide();
    favoritesList.hide();

    const thumbnail = `${comic.get("thumbnail").path}.${comic.get("thumbnail").extension}`;
    const description = comic.get("description") || "Sin descripción disponible.";
    const date = (comic.get("dates").find(d => d.type === "onsaleDate")?.date || "").substring(0, 10) || "Desconocida";
    const pages = comic.get("pageCount") || "No disponible";
    const price = (comic.get("prices")?.[0]?.price) ? `$${comic.get("prices")[0].price}` : "No disponible";

    this.$el.html(`
      <button id="back-btn">⬅ Volver</button>
      <div class="comic-detail-content">
        <img src="${thumbnail}" alt="${comic.get("title")}" />
        <div>
          <h2>${comic.get("title")}</h2>
          <p><strong>Descripción:</strong> ${description}</p>
          <p><strong>Fecha de publicación:</strong> ${date}</p>
          <p><strong>Páginas:</strong> ${pages}</p>
          <p><strong>Precio:</strong> ${price}</p>
        </div>
      </div>
    `);
  },

  onBack() {
    this.$el.hide();
    searchInput.show();
    // Mostrar la lista activa según menú
    if (currentView === "comics") {
      comicList.show();
    } else if (currentView === "favorites") {
      favoritesList.show();
    }
  }
});

// Función para obtener cómics de Marvel API

function fetchComics(query = "") {
  comicList.html("<p>Cargando cómics...</p>");
  comicDetail.hide();
  comicList.show();
  favoritesList.hide();

  const baseUrl = `https://gateway.marvel.com/v1/public/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=12`;
  const url = query ? `${baseUrl}&titleStartsWith=${encodeURIComponent(query)}` : baseUrl;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Error en la respuesta de la API");
      return res.json();
    })
    .then(data => {
      comicsCollection.reset(data.data.results);
    })
    .catch(err => {
      console.error("Error al cargar los cómics:", err);
      comicList.html("<p>Error al cargar los cómics.</p>");
    });
}

// Manejo de autenticación

loginBtn.on("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(console.error);
});

logoutBtn.on("click", () => {
  auth.signOut();
});

// Variable para saber qué vista está activa
let currentView = "comics";

auth.onAuthStateChanged(user => {
  if (user) {
    userInfo.text(`Hola, ${user.displayName}`);
    loginBtn.hide();
    logoutBtn.show();
    searchInput.show();

    comicsCollection = new ComicsCollection();
    favoritesCollection = new FavoritesCollection(user.uid);

    comicsListView = new ComicsListView({
      collection: comicsCollection,
      favorites: favoritesCollection
    });

    favoritesListView = new FavoritesListView({
      collection: favoritesCollection
    });

    comicDetailView = new ComicDetailView();

    favoritesCollection.on("update reset add remove", () => {
      comicsListView.render();
      favoritesListView.render();
    });

    fetchComics();

    showView(currentView);

  } else {
    userInfo.text("");
    loginBtn.show();
    logoutBtn.hide();
    searchInput.hide();
    comicList.html("<p>Inicia sesión para ver y guardar tus cómics favoritos.</p>");
    favoritesList.html("");
    comicDetail.hide();
    currentView = "comics";
    showView(currentView);
  }
});

// Función para mostrar vista según menú

function showView(view) {
  if (view === "comics") {
    comicList.show();
    favoritesList.hide();
    comicDetail.hide();
    searchInput.show();
    btnComics.addClass("active");
    btnFavorites.removeClass("active");
  } else if (view === "favorites") {
    comicList.hide();
    favoritesList.show();
    comicDetail.hide();
    searchInput.hide();
    btnComics.removeClass("active");
    btnFavorites.addClass("active");
  }
  currentView = view;
}

// Eventos menú

btnComics.on("click", () => {
  showView("comics");
});

btnFavorites.on("click", () => {
  showView("favorites");
});

// Buscar cómics con debounce

searchInput.on("input", _.debounce(() => {
  const val = searchInput.val().trim();
  if (val.length >= 3 || val.length === 0) {
    fetchComics(val);
  } else {
    comicList.html("");
  }
}, 500));

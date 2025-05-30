const ComicsListView = Backbone.View.extend({
  el: "#comic-list",

  initialize(options) {
    this.collection = options.collection;
    this.favorites = options.favorites;
    this.listenTo(this.collection, "reset", this.render);
    this.listenTo(this.favorites, "update reset add remove", this.render);
  },

  events: {
    "click .comic": "onComicClick",
    "click .fav-btn": "onFavClick",
  },

  render() {
    this.$el.empty();
    if (this.collection.length === 0) {
      this.$el.html("<p>No se encontraron cómics.</p>");
      return this;
    }

    this.collection.each((comic) => {
      const isFav = this.favorites && this.favorites.isFavorite(comic.get("id"));
      const thumb = comic.get("thumbnail");
      const thumbnail = thumb ? `${thumb.path}.${thumb.extension}` : "";

      this.$el.append(`
        <div class="comic" data-id="${comic.get("id")}">
          <h3>${comic.get("title")}</h3>
          <img src="${thumbnail}" alt="${comic.get("title")}" />
          <button class="fav-btn">
            ${isFav ? "★ Quitar favorito" : "☆ Agregar favorito"}
          </button>
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
    if (!this.favorites) {
      return alert("Inicia sesión para usar favoritos.");
    }

    const $btn = $(e.currentTarget);
    const $comicDiv = $btn.closest(".comic");
    const comicId = $comicDiv.data("id");
    const comic = this.collection.get(comicId);

    if (this.favorites.isFavorite(comicId)) {
      // Cambiar texto inmediatamente
      $btn.text("☆ Agregar favorito");
      this.favorites.removeFavorite(comicId).catch(() => {
        // Si falla, revertir texto
        $btn.text("★ Quitar favorito");
      });
    } else {
      $btn.text("★ Quitar favorito");
      this.favorites.addFavorite(comic).catch(() => {
        // Si falla, revertir texto
        $btn.text("☆ Agregar favorito");
      });
    }
  },
});

const ComicDetailView = Backbone.View.extend({
  el: "#comic-detail",

  events: {
    "click #back-btn": "onBack",
  },

  show(comic) {
    this.$el.show();
    $("#search").hide();
    $("#comic-list").hide();
    $("#favorites-list").hide();

    const thumb = comic.get("thumbnail");
    const thumbnail = thumb ? `${thumb.path}.${thumb.extension}` : "";
    const description =
      comic.get("description") || "Sin descripción disponible.";
    const date =
      (
        comic.get("dates").find((d) => d.type === "onsaleDate")?.date || ""
      ).substring(0, 10) || "Desconocida";
    const pages = comic.get("pageCount") || "No disponible";
    const price = comic.get("prices")?.[0]?.price
      ? `$${comic.get("prices")[0].price}`
      : "No disponible";

    this.$el.html(`
      <button id="back-btn">⬅ Volver</button>
      <div class="comic-detail-content">
        <img src="${thumbnail}" alt="${comic.get("title")}" />
        <h2>${comic.get("title")}</h2>
        <p><strong>Descripción:</strong> ${description}</p>
        <p><strong>Fecha de venta:</strong> ${date}</p>
        <p><strong>Páginas:</strong> ${pages}</p>
        <p><strong>Precio:</strong> ${price}</p>
      </div>
    `);
  },

  onBack() {
    this.$el.hide();
    $("#search").show();
    $("#comic-list").show();
    $("#favorites-list").hide();
  },
});

const FavoritesListView = Backbone.View.extend({
  el: "#favorites-list",

  initialize(options) {
    this.collection = options.collection;
    this.listenTo(this.collection, "update reset add remove", this.render);
  },

  events: {
    "click .favorite": "onFavoriteClick",
    "click .fav-btn": "onFavBtnClick",
  },

  render() {
    this.$el.empty();
    if (this.collection.length === 0) {
      this.$el.html("<p>No tienes favoritos aún.</p>");
      return this;
    }

    this.collection.each((fav) => {
      const thumb = fav.get("thumbnail");
      const thumbnail = thumb ? `${thumb.path}.${thumb.extension}` : "";

      this.$el.append(`
        <div class="favorite" data-id="${fav.get("id")}">
          <h3>${fav.get("title")}</h3>
          <img src="${thumbnail}" alt="${fav.get("title")}" />
          <button class="fav-btn">✖ Quitar</button>
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

  onFavBtnClick(e) {
    e.stopPropagation();
    const $btn = $(e.currentTarget);
    const $favDiv = $btn.closest(".favorite");
    const comicId = $favDiv.data("id");
    favoritesCollection.removeFavorite(comicId);
  },
});

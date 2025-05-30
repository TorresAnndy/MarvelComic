const FavoritesCollection = Backbone.Collection.extend({
  model: ComicModel,

  initialize(models, options) {
    this.userId = options.userId;
    this.listenToFirebase();
  },

  listenToFirebase() {
    firebase
      .firestore()
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          data.id = change.doc.id;
          if (change.type === "added") {
            if (!this.get(data.id)) this.add(data);
          } else if (change.type === "removed") {
            this.remove(data.id);
          } else if (change.type === "modified") {
            const model = this.get(data.id);
            if (model) model.set(data);
          }
        });
      });
  },

  isFavorite(comicId) {
    const idNum = Number(comicId);
    return this.some((fav) => Number(fav.get("id")) === idNum);
  },

  addFavorite(comic) {
    if (this.isFavorite(comic.get("id"))) return Promise.resolve();

    return firebase
      .firestore()
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .doc(comic.get("id").toString())
      .set(comic.toJSON())
      .then(() => {
        this.add(comic);
      });
  },

  removeFavorite(comicId) {
    return firebase
      .firestore()
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .doc(comicId.toString())
      .delete()
      .then(() => {
        const model = this.get(comicId);
        if (model) this.remove(model);
      });
  },
});

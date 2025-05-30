const ComicsCollection = Backbone.Collection.extend({
  model: Comic
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

    this.unsubscribe = firebase.firestore()
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
    return firebase.firestore()
      .collection("users")
      .doc(this.userId)
      .collection("favorites")
      .doc(comic.get("id").toString())
      .set(comic.toJSON());
  },

  removeFavorite(comicId) {
    return firebase.firestore()
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

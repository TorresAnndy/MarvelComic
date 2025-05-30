const publicKey = "55e32c33fc52b6cb15859f117b7df89b";
const ts = "1";
const hash = "6236f41a16f9285e016ddb3bb1dfb522";

function fetchComics(query = "") {
  let baseUrl = `https://gateway.marvel.com/v1/public/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=12`;
  if (query) {
    baseUrl += `&titleStartsWith=${encodeURIComponent(query)}`;
  }
  return fetch(baseUrl)
    .then(res => {
      if (!res.ok) throw new Error("Error en la respuesta de Marvel API");
      return res.json();
    })
    .then(data => data.data.results)
    .catch(err => {
      console.error(err);
      return [];
    });
}

const publicKey = "55e32c33fc52b6cb15859f117b7df89b";
const ts = "1";
const hash = "6236f41a16f9285e016ddb3bb1dfb522";

const comicList = document.getElementById("comic-list");
const searchInput = document.getElementById("search");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length >= 3) {
    fetchComics(query);
  } else {
    comicList.innerHTML = "";
  }
});

function fetchComics(query) {
  const url = `https://gateway.marvel.com/v1/public/comics?titleStartsWith=${encodeURIComponent(
    query
  )}&ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=12`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      renderComics(data.data.results);
    })
    .catch((err) => {
      console.error("Error al cargar los cómics:", err);
    });
}

function renderComics(comics) {
  comicList.innerHTML = "";

  if (comics.length === 0) {
    comicList.innerHTML = "<p>No se encontraron cómics.</p>";
    return;
  }

  comics.forEach((comic) => {
    const div = document.createElement("div");
    div.className = "comic";
    const thumbnail = `${comic.thumbnail.path}.${comic.thumbnail.extension}`;

    div.innerHTML = `
    <h3>${comic.title}</h3>
    <img src="${thumbnail}" alt="${comic.title}" />
  `;

    div.addEventListener("click", () => showComicDetail(comic)); // 👈 evento al hacer clic

    comicList.appendChild(div);
  });
}

function showComicDetail(comic) {
  const container = document.querySelector('.container');

  const thumbnail = `${comic.thumbnail.path}.${comic.thumbnail.extension}`;
  const description = comic.description || 'Sin descripción disponible.';
  const date = comic.dates.find(d => d.type === 'onsaleDate')?.date?.substring(0, 10) || 'Desconocida';
  const pages = comic.pageCount || 'No disponible';
  const price = comic.prices[0]?.price ? `$${comic.prices[0].price}` : 'No disponible';

  // HTML del detalle
  container.innerHTML = `
    <button id="back-btn">⬅ Volver</button>
    <div class="comic-detail">
      <img src="${thumbnail}" alt="${comic.title}" />
      <div>
        <h2>${comic.title}</h2>
        <p><strong>Descripción:</strong> ${description}</p>
        <p><strong>Fecha de publicación:</strong> ${date}</p>
        <p><strong>Páginas:</strong> ${pages}</p>
        <p><strong>Precio:</strong> ${price}</p>
      </div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => {
    location.reload(); // o puedes volver a cargar resultados con el query anterior
  });
}

const publicKey = "55e32c33fc52b6cb15859f117b7df89b";
const ts = "1";
const hash = "6236f41a16f9285e016ddb3bb1dfb522";

const comicList = document.getElementById("comic-list");
const searchInput = document.getElementById("search");
const comicDetail = document.getElementById("comic-detail");

let lastQuery = "";

window.addEventListener("load", () => {
  fetchComics(); // Mostrar cómics generales al cargar
});

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  lastQuery = query;
  if (query.length >= 3) {
    fetchComics(query);
  } else if (query.length === 0) {
    fetchComics();
  } else {
    comicList.innerHTML = "";
    comicDetail.style.display = "none";
    comicList.style.display = "block";
  }
});

async function fetchComics(query = "") {
  comicList.innerHTML = "<p>Cargando cómics...</p>"; // loader simple
  comicDetail.style.display = "none";
  comicList.style.display = "grid";

  const baseUrl = `https://gateway.marvel.com/v1/public/comics?ts=${ts}&apikey=${publicKey}&hash=${hash}&limit=12`;
  const url = query ? `${baseUrl}&titleStartsWith=${encodeURIComponent(query)}` : baseUrl;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la respuesta de la API");
    const data = await res.json();
    renderComics(data.data.results);
  } catch (err) {
    console.error("Error al cargar los cómics:", err);
    comicList.innerHTML = "<p>Error al cargar los cómics.</p>";
  }
}

function renderComics(comics) {
  comicDetail.style.display = "none";
  comicList.style.display = "grid";

  comicList.innerHTML = "";

  if (comics.length === 0) {
    comicList.innerHTML = "<p>No se encontraron cómics.</p>";
    return;
  }

  comics.forEach((comic) => {
    const div = document.createElement("div");
    div.className = "comic";
    div.style.cursor = "pointer"; // cursor pointer para mejor UX

    const thumbnail = `${comic.thumbnail.path}.${comic.thumbnail.extension}`;

    div.innerHTML = `
      <h3>${comic.title}</h3>
      <img src="${thumbnail}" alt="${comic.title}" />
    `;

    div.addEventListener("click", () => showComicDetail(comic));
    comicList.appendChild(div);
  });
}

function showComicDetail(comic) {
  comicList.style.display = "none";
  searchInput.style.display = "none";
  comicDetail.style.display = "block";

  const thumbnail = `${comic.thumbnail.path}.${comic.thumbnail.extension}`;
  const description = comic.description || "Sin descripción disponible.";
  const date = comic.dates.find(d => d.type === "onsaleDate")?.date?.substring(0, 10) || "Desconocida";
  const pages = comic.pageCount || "No disponible";
  const price = (comic.prices && comic.prices[0] && comic.prices[0].price)
    ? `$${comic.prices[0].price}`
    : "No disponible";

  comicDetail.innerHTML = `
    <button id="back-btn">⬅ Volver</button>
    <div class="comic-detail-content">
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

  document.getElementById("back-btn").addEventListener("click", () => {
    comicDetail.style.display = "none";
    searchInput.style.display = "block";
    fetchComics(lastQuery.length >= 3 ? lastQuery : "");
  });
}

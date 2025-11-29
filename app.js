// Shared app logic used by both pages.
// Key: books are saved in localStorage under "mini_books_v1"

const DEFAULT_IMAGE = "https://m.media-amazon.com/images/I/71ZB18P3inL._SY522_.jpg";
const STORAGE_KEY = "mini_books_v1";

/* Utility: read/write storage */
function readBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){
    console.error(e);
    return [];
  }
}
function writeBooks(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* Create id for each book */
function createId() {
  return "b_" + Math.random().toString(36).slice(2,9);
}

/* Book card markup */
function createCard(book) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = book.id;
  div.innerHTML = `
    <img src="${escapeHtml(book.imageUrl || DEFAULT_IMAGE)}" alt="${escapeHtml(book.title)}" />
    <h3>${escapeHtml(book.title)}</h3>
    <div class="meta">By ${escapeHtml(book.author)} • ${escapeHtml(book.category)}</div>
    <div class="card-actions">
      <button class="danger" data-action="delete">Delete</button>
    </div>
  `;
  return div;
}

/* Prevent basic html injection in text values (simple) */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* Render grid in given container with options */
function renderGrid(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  let books = readBooks();

  // Filter
  if (options.filter && options.filter !== "All") {
    books = books.filter(b => b.category === options.filter);
  }

  // Sort
  if (options.sort === "asc") {
    books.sort((a,b) => a.title.localeCompare(b.title));
  } else if (options.sort === "desc") {
    books.sort((a,b) => b.title.localeCompare(a.title));
  }

  container.innerHTML = "";
  if (books.length === 0) {
    const note = document.createElement("div");
    note.className = "small-note";
    note.textContent = "No books found. Add some from the Admin page.";
    container.appendChild(note);
    return;
  }

  books.forEach(book => {
    const card = createCard(book);
    container.appendChild(card);
  });
}

/* Setup delete handler delegated to container */
function attachDeleteHandler(containerSelector) {
  const container = document.querySelector(containerSelector);
  if(!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='delete']");
    if (!btn) return;
    const card = btn.closest(".card");
    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;
    if (!confirm("Delete this book?")) return;
    let books = readBooks();
    books = books.filter(b => b.id !== id);
    writeBooks(books);
    card.remove();
  });
}

/* Admin page: handle form submit and clear */
function initAdminPage() {
  const form = document.getElementById("addBookForm");
  const adminGrid = document.getElementById("adminGrid");
  const clearBtn = document.getElementById("clearStorage");

  // initial render
  renderGrid("#adminGrid");

  attachDeleteHandler("#adminGrid");

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const title = form.title.value.trim();
    const author = form.author.value.trim();
    const category = form.category.value;
    const imageUrl = form.imageUrl.value.trim() || DEFAULT_IMAGE;

    if (!title || !author || !category) {
      alert("Please fill Title, Author and Category.");
      return;
    }

    const books = readBooks();
    const newBook = {
      id: createId(),
      title,
      author,
      category,
      imageUrl
    };
    books.push(newBook);
    writeBooks(books);

    // reset form
    form.reset();

    // re-render
    renderGrid("#adminGrid");
    alert("Book added!");
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear all books from storage?")) return;
      localStorage.removeItem(STORAGE_KEY);
      renderGrid("#adminGrid");
    });
  }
}

/* Home page: setup filter/sort UI and rendering */
function initHomePage() {
  const filter = document.getElementById("filterCategory");
  const sortSel = document.getElementById("sortSelect");
  const booksGrid = document.getElementById("booksGrid");

  function doRender() {
    renderGrid("#booksGrid", { filter: filter?.value || "All", sort: sortSel?.value || "none" });
  }

  // initial render
  doRender();

  if (filter) filter.addEventListener("change", doRender);
  if (sortSel) sortSel.addEventListener("change", doRender);

  attachDeleteHandler("#booksGrid");
}

/* Entry: determine page and init (only in browser) */
if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#addBookForm")) {
      initAdminPage();
    }
    if (document.querySelector("#booksGrid")) {
      initHomePage();
    }
  });
}
(() => {
  "use strict";

  const products = Array.isArray(window.CATALOG_PRODUCTS) ? window.CATALOG_PRODUCTS : [];
  const productById = new Map(products.map((product) => [product.id, product]));
  const productList = document.querySelector("#product-list");
  const searchInput = document.querySelector("#catalog-search");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const resultsCount = document.querySelector("#results-count");
  const resetButton = document.querySelector("#reset-filters");
  const emptyState = document.querySelector("#empty-state");
  const imageDialog = document.querySelector("#image-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogClose = document.querySelector(".dialog-close");
  const productDialog = document.querySelector("#product-dialog");
  const productDialogKicker = document.querySelector("#product-dialog-kicker");
  const productDialogTitle = document.querySelector("#product-dialog-title");
  const productDialogContent = document.querySelector("#product-dialog-content");
  const productDialogClose = document.querySelector(".product-dialog-close");
  const progress = document.querySelector(".scroll-progress span");
  let activeFilter = "all";
  let dialogTrigger = null;

  const escapeHtml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const normalize = (value = "") => String(value)
    .toLocaleLowerCase("uk-UA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const flattenValues = (value) => {
    if (Array.isArray(value)) return value.flatMap(flattenValues);
    if (value && typeof value === "object") return Object.values(value).flatMap(flattenValues);
    return typeof value === "string" || typeof value === "number" ? [String(value)] : [];
  };

  const pluralizeProducts = (count) => {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "товарів";
    if (last === 1) return "товар";
    if (last >= 2 && last <= 4) return "товари";
    return "товарів";
  };

  const accentClass = (accent) => accent ? ` product-card-${escapeHtml(accent)}` : "";

  const renderCard = (product, index) => {
    const searchText = normalize(flattenValues(product).join(" "));
    const uses = product.uses.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    const benefits = product.benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const loading = index === 0 ? "eager" : "lazy";
    const fetchPriority = index === 0 ? "high" : "auto";

    return `
      <article class="product-card${accentClass(product.accent)}" data-category="${escapeHtml(product.category)}" data-search="${escapeHtml(searchText)}" data-product-id="${escapeHtml(product.id)}">
        <div class="product-media">
          <button class="image-open" type="button" data-action="image" data-product-id="${escapeHtml(product.id)}" aria-label="Відкрити зображення застосування ${escapeHtml(product.name)}">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.imageAlt)}" width="1200" height="1200" loading="${loading}" fetchpriority="${fetchPriority}">
            <span class="zoom-label" aria-hidden="true">Збільшити <b>↗</b></span>
          </button>
        </div>
        <div class="product-content">
          <p class="seller-label">Що це</p>
          <h3>${escapeHtml(product.title)}</h3>
          <p class="product-subtitle">${escapeHtml(product.summary)}</p>
          <div class="usage-section">
            <p class="seller-label">Де використовують</p>
            <div class="tag-list" aria-label="Застосування ${escapeHtml(product.name)}">${uses}</div>
          </div>
          <section class="characteristics-section" aria-label="Ключові характеристики ${escapeHtml(product.name)}">
            <p class="seller-label">Ключові характеристики</p>
            <ul class="benefit-list">${benefits}</ul>
          </section>
          <footer class="product-footer">
            <div class="product-footer-name">
              <p class="seller-label">Назва продукту</p>
              <h4 class="product-name">${escapeHtml(product.name)}</h4>
            </div>
            <div class="product-footer-actions">
              <button class="button button-price price-open" type="button" data-action="price" data-product-id="${escapeHtml(product.id)}" aria-haspopup="dialog" aria-label="Фасування і ціна для ${escapeHtml(product.name)}">Фасування і ціна <span aria-hidden="true">₴</span></button>
              <button class="button button-primary details-open" type="button" data-action="details" data-product-id="${escapeHtml(product.id)}" aria-haspopup="dialog" aria-label="Деталі товару ${escapeHtml(product.name)}">Деталі товару <span aria-hidden="true">＋</span></button>
            </div>
          </footer>
        </div>
      </article>`;
  };

  if (productList) productList.innerHTML = products.map(renderCard).join("");

  const productCards = Array.from(document.querySelectorAll(".product-card"));
  const heroCount = document.querySelector(".hero-count strong");
  const heroCountLabel = document.querySelector(".hero-count span");
  if (heroCount) heroCount.textContent = String(products.length).padStart(2, "0");
  if (heroCountLabel) heroCountLabel.innerHTML = `${pluralizeProducts(products.length)}<br>у каталозі`;

  const debounce = (callback, delay = 140) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const applyFilters = () => {
    const query = normalize(searchInput?.value);
    let visible = 0;

    productCards.forEach((card) => {
      const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesSearch = !query || normalize(card.dataset.search).includes(query);
      const shouldShow = matchesCategory && matchesSearch;
      card.hidden = !shouldShow;
      card.classList.remove("is-entering");
      if (shouldShow) {
        visible += 1;
        window.requestAnimationFrame(() => card.classList.add("is-entering"));
      }
    });

    if (resultsCount) resultsCount.textContent = `Показано ${visible} із ${productCards.length} ${pluralizeProducts(productCards.length)}`;
    if (emptyState) emptyState.hidden = visible !== 0;
    if (resetButton) resetButton.hidden = activeFilter === "all" && !query;
  };

  const resetFilters = () => {
    activeFilter = "all";
    if (searchInput) searchInput.value = "";
    filterButtons.forEach((button) => {
      const isAll = button.dataset.filter === "all";
      button.classList.toggle("is-active", isAll);
      button.setAttribute("aria-pressed", String(isAll));
    });
    applyFilters();
    searchInput?.focus();
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", debounce(applyFilters));
  resetButton?.addEventListener("click", resetFilters);
  document.querySelectorAll("[data-reset]").forEach((button) => button.addEventListener("click", resetFilters));

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  });

  const closeImageDialog = () => {
    if (imageDialog?.open) imageDialog.close();
  };

  const showImageDialog = (product, trigger) => {
    if (!imageDialog || !dialogImage || !dialogTitle) return;
    dialogTrigger = trigger;
    dialogImage.src = product.image;
    dialogImage.alt = product.imageAlt;
    dialogTitle.textContent = product.name;
    imageDialog.showModal();
    document.body.classList.add("dialog-open");
  };

  dialogClose?.addEventListener("click", closeImageDialog);
  imageDialog?.addEventListener("click", (event) => {
    if (event.target === imageDialog) closeImageDialog();
  });
  imageDialog?.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    dialogImage?.removeAttribute("src");
    dialogTrigger?.focus();
    dialogTrigger = null;
  });

  const cellMarkup = (primary, secondary) => `
    <strong>${escapeHtml(primary)}</strong>
    ${secondary ? `<span>${escapeHtml(secondary)}</span>` : ""}`;

  const renderPriceDialog = (product) => {
    const rows = product.prices.map((price) => `
      <tr>
        <th scope="row" data-label="Фасування">${cellMarkup(price.pack, price.packNote)}</th>
        <td data-label="Роздрібна">${cellMarkup(price.retail, price.retailNote)}</td>
        <td data-label="Партнерам">${cellMarkup(price.partner || product.partnerPrice, "телефоном")}</td>
        <td data-label="Великий опт">${cellMarkup(price.wholesale || product.wholesalePrice, "залежить від обсягу")}</td>
      </tr>`).join("");

    return `
      <p class="pricing-lead">Фасування зібрані в одній картці товару. Роздрібні ціни наведено станом на 31.08.2026; партнерський і великий опт погоджуються під реальний обсяг.</p>
      <div class="pricing-table-wrap">
        <table class="pricing-table">
          <caption class="visually-hidden">Фасування і ціни для ${escapeHtml(product.name)}</caption>
          <thead><tr><th scope="col">Фасування</th><th scope="col">Роздрібна ціна</th><th scope="col">Для партнерів</th><th scope="col">Великий опт</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="pricing-volume-note"><strong>Більша партія — нижча ціна.</strong> ${escapeHtml(product.priceNote)}</p>
      <a class="button button-accent pricing-phone" href="tel:+380503403547" aria-label="Зателефонувати для розрахунку партії: +38 050 340 35 47">Уточнити партнерську ціну: +38 050 340 35 47 <span aria-hidden="true">↗</span></a>`;
  };

  const renderDetailsDialog = (product) => {
    const applications = product.details.applications.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const specs = product.details.specs.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");

    return `
      <p class="detail-lead">${escapeHtml(product.details.lead)}</p>
      <div class="detail-columns">
        <section class="detail-section">
          <h3>Застосування</h3>
          <ul>${applications}</ul>
        </section>
        <section class="detail-section">
          <h3>Технічні параметри</h3>
          <dl class="detail-specs">${specs}</dl>
        </section>
      </div>
      <p class="detail-note"><strong>Важливо:</strong> ${escapeHtml(product.details.note)}</p>`;
  };

  const closeProductDialog = () => {
    if (productDialog?.open) productDialog.close();
  };

  const showProductDialog = (product, type, trigger) => {
    if (!productDialog || !productDialogTitle || !productDialogContent) return;
    dialogTrigger = trigger;
    const isPrice = type === "price";
    if (productDialogKicker) productDialogKicker.textContent = isPrice ? "Фасування та умови" : "Технічні відомості";
    productDialogTitle.textContent = isPrice ? `Фасування і ціна — ${product.name}` : product.name;
    productDialogContent.innerHTML = isPrice ? renderPriceDialog(product) : renderDetailsDialog(product);
    productDialogContent.setAttribute("aria-label", isPrice ? `Фасування і ціни на ${product.name}` : `Технічні відомості про ${product.name}`);
    productDialogContent.scrollTop = 0;
    productDialog.showModal();
    document.body.classList.add("dialog-open");
  };

  productList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-product-id]");
    if (!button || !productList.contains(button)) return;
    const product = productById.get(button.dataset.productId);
    if (!product) return;
    if (button.dataset.action === "image") showImageDialog(product, button);
    if (button.dataset.action === "price" || button.dataset.action === "details") showProductDialog(product, button.dataset.action, button);
  });

  productDialogClose?.addEventListener("click", closeProductDialog);
  productDialog?.addEventListener("click", (event) => {
    if (event.target === productDialog) closeProductDialog();
  });
  productDialog?.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    productDialogContent?.replaceChildren();
    dialogTrigger?.focus();
    dialogTrigger = null;
  });

  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
  };

  const setupButtonAttention = () => {
    const mobileViewport = window.matchMedia("(max-width: 720px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mobileViewport.matches || reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target.closest(".product-card");
        if (!card) return;
        card.classList.add("is-button-highlighted");
        observer.unobserve(entry.target);
      });
    }, { threshold: .55, rootMargin: "0px 0px -8% 0px" });

    productCards.forEach((card) => {
      const actions = card.querySelector(".product-footer-actions");
      if (actions) observer.observe(actions);
    });
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  const currentYear = document.querySelector("#current-year");
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
  setupButtonAttention();
  applyFilters();
  updateProgress();
})();

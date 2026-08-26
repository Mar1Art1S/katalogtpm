(() => {
  "use strict";

  const searchInput = document.querySelector("#catalog-search");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const productCards = Array.from(document.querySelectorAll(".product-card"));
  const resultsCount = document.querySelector("#results-count");
  const resetButton = document.querySelector("#reset-filters");
  const emptyState = document.querySelector("#empty-state");
  const dialog = document.querySelector("#image-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogClose = document.querySelector(".dialog-close");
  const productDialog = document.querySelector("#product-dialog");
  const productDialogTitle = document.querySelector("#product-dialog-title");
  const productDialogContent = document.querySelector("#product-dialog-content");
  const productDialogClose = document.querySelector(".product-dialog-close");
  const progress = document.querySelector(".scroll-progress span");
  let activeFilter = "all";
  let detailsTrigger = null;

  const normalize = (value) => value
    .toLocaleLowerCase("uk-UA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const debounce = (callback, delay = 140) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    let visible = 0;

    productCards.forEach((card) => {
      const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesSearch = !query || normalize(card.dataset.search).includes(query);
      const shouldShow = matchesCategory && matchesSearch;
      card.hidden = !shouldShow;
      card.classList.remove("is-entering");
      if (shouldShow) {
        visible += 1;
        requestAnimationFrame(() => card.classList.add("is-entering"));
      }
    });

    resultsCount.textContent = `Показано ${visible} із ${productCards.length} ${visible === 1 ? "товару" : "товарів"}`;
    emptyState.hidden = visible !== 0;
    resetButton.hidden = activeFilter === "all" && !query;
  };

  const resetFilters = () => {
    activeFilter = "all";
    searchInput.value = "";
    filterButtons.forEach((button) => {
      const isAll = button.dataset.filter === "all";
      button.classList.toggle("is-active", isAll);
      button.setAttribute("aria-pressed", String(isAll));
    });
    applyFilters();
    searchInput.focus();
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      applyFilters();
    });
  });

  searchInput.addEventListener("input", debounce(applyFilters));
  resetButton.addEventListener("click", resetFilters);
  document.querySelectorAll("[data-reset]").forEach((button) => button.addEventListener("click", resetFilters));

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };

  document.querySelectorAll(".image-open").forEach((button) => {
    button.addEventListener("click", () => {
      dialogImage.src = button.dataset.image;
      dialogImage.alt = `Зображення застосування товару ${button.dataset.title}`;
      dialogTitle.textContent = button.dataset.title;
      dialog.showModal();
      document.body.classList.add("dialog-open");
    });
  });

  dialogClose.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    dialogImage.removeAttribute("src");
  });

  const closeProductDialog = () => {
    if (productDialog.open) productDialog.close();
  };

  document.querySelectorAll(".details-open").forEach((button) => {
    button.addEventListener("click", () => {
      const template = document.getElementById(button.dataset.details);
      if (!(template instanceof HTMLTemplateElement)) return;

      detailsTrigger = button;
      productDialogTitle.textContent = button.dataset.title;
      productDialogContent.replaceChildren(template.content.cloneNode(true));
      productDialogContent.scrollTop = 0;
      productDialog.showModal();
      document.body.classList.add("dialog-open");
    });
  });

  productDialogClose.addEventListener("click", closeProductDialog);
  productDialog.addEventListener("click", (event) => {
    if (event.target === productDialog) closeProductDialog();
  });
  productDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    productDialogContent.replaceChildren();
    detailsTrigger?.focus();
    detailsTrigger = null;
  });

  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());
  updateProgress();
})();

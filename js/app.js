(function () {
  var allApartments = [];
  var filtered = [];
  var quickMode = "all";
  var storageKey = "kupujemkvartirku-state-v1";
  var userState = loadState();

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(userState));
  }

  function getState(id) {
    return userState[id] || { favorite: false, visited: false };
  }

  function setState(id, key, value) {
    if (!userState[id]) userState[id] = { favorite: false, visited: false };
    userState[id][key] = value;
    saveState();
    applyFilters();
  }

  function euro(value) {
    return "€" + Number(value).toLocaleString("ru-RU");
  }

  function ppsqm(apartment) {
    return Math.round(apartment.price / apartment.area);
  }

  function firstImage(apartment) {
    return apartment.images && apartment.images.length ? apartment.images[0] : "";
  }

  function escapeHtml(value) {
    return $("<div>").text(value == null ? "" : String(value)).html();
  }

  function fillSelects() {
    var districts = [];
    var sources = [];
    allApartments.forEach(function (a) {
      if (districts.indexOf(a.district) === -1) districts.push(a.district);
      if (sources.indexOf(a.source) === -1) sources.push(a.source);
    });
    districts.sort().forEach(function (v) {
      $("#districtFilter").append($("<option>").val(v).text(v));
    });
    sources.sort().forEach(function (v) {
      $("#sourceFilter").append($("<option>").val(v).text(v));
    });
  }

  function renderStats() {
    var total = allApartments.length;
    var median = allApartments.slice().sort(function (a,b) { return a.price - b.price; });
    var medianPrice = total ? median[Math.floor(total / 2)].price : 0;
    var avgSqm = total ? Math.round(allApartments.reduce(function (sum, a) { return sum + ppsqm(a); }, 0) / total) : 0;
    $("#heroStats").html(
      '<div class="stat"><strong>' + total + '</strong><span>объектов</span></div>' +
      '<div class="stat"><strong>' + (medianPrice ? euro(medianPrice) : "—") + '</strong><span>медиана</span></div>' +
      '<div class="stat"><strong>' + (avgSqm ? euro(avgSqm) : "—") + '</strong><span>средний €/м²</span></div>'
    );
  }

  function matchesQuick(a) {
    var state = getState(a.id);
    if (quickMode === "favorites") return state.favorite;
    if (quickMode === "visited") return state.visited;
    if (quickMode === "unvisited") return !state.visited;
    return true;
  }

  function applyFilters() {
    var q = ($("#searchFilter").val() || "").trim().toLowerCase();
    var district = $("#districtFilter").val();
    var maxPrice = Number($("#priceFilter").val()) || Infinity;
    var minArea = Number($("#areaFilter").val()) || 0;
    var minRooms = Number($("#roomsFilter").val()) || 0;
    var source = $("#sourceFilter").val();
    var sort = $("#sortFilter").val();

    filtered = allApartments.filter(function (a) {
      var haystack = [a.title, a.address, a.district, a.neighborhood, a.comment].join(" ").toLowerCase();
      return (!q || haystack.indexOf(q) !== -1) &&
        (!district || a.district === district) &&
        a.price <= maxPrice &&
        a.area >= minArea &&
        a.rooms >= minRooms &&
        (!source || a.source === source) &&
        matchesQuick(a);
    });

    filtered.sort(function (a, b) {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "sqm-asc") return ppsqm(a) - ppsqm(b);
      if (sort === "area-desc") return b.area - a.area;
      return (a.priority || 99) - (b.priority || 99);
    });

    renderAll();
  }

  function badges(a) {
    var html = "";
    if (a.registered === true) html += '<span class="badge badge--good">uknjiženo</span>';
    if (a.bedrooms) html += '<span class="badge">' + a.bedrooms + ' спальн.</span>';
    if (a.renovated) html += '<span class="badge badge--good">ремонт</span>';
    if (a.floor && /prizem|0\//i.test(a.floor)) html += '<span class="badge badge--warn">низкий этаж</span>';
    if (a.priority <= 2) html += '<span class="badge badge--good">наш топ</span>';
    return html;
  }

  function imageOrPlaceholder(a, className) {
    var img = firstImage(a);
    if (!img) return '<div class="' + className + '__placeholder">⌂</div>';
    return '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(a.title) + '" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;' + className + '__placeholder&quot;>⌂</div>\'">';
  }

  function renderShortlist() {
    var html = "";
    filtered.slice(0, 8).forEach(function (a) {
      html += '<article class="short-card" data-id="' + a.id + '">' +
        imageOrPlaceholder(a, "short-card") +
        '<div><h3>' + escapeHtml(a.title) + '</h3>' +
        '<div class="short-card__price">' + euro(a.price) + '</div>' +
        '<div class="short-card__meta">' + a.area + ' м² · ' + a.rooms + ' · ' + euro(ppsqm(a)) + '/м²</div>' +
        '<div class="short-card__badges">' + badges(a) + '</div></div>' +
        '</article>';
    });
    if (!html) html = '<p class="muted">Ничего не найдено. Сбрось часть фильтров.</p>';
    $("#shortlistCards").html(html);
    $("#resultsCount").text(filtered.length + " шт.");
  }

  function renderTable() {
    var html = "";
    filtered.forEach(function (a) {
      var state = getState(a.id);
      html += '<tr data-id="' + a.id + '">' +
        '<td><button class="icon-button favorite-btn ' + (state.favorite ? "active" : "") + '" data-id="' + a.id + '" title="В фавориты">★</button></td>' +
        '<td class="row-object"><strong>' + escapeHtml(a.title) + '</strong><small>' + escapeHtml(a.neighborhood || a.district) + '</small></td>' +
        '<td class="price">' + euro(a.price) + '</td>' +
        '<td>' + a.area + '</td>' +
        '<td>' + a.rooms + '</td>' +
        '<td class="ppsqm">' + euro(ppsqm(a)) + '</td>' +
        '<td>' + escapeHtml(a.floor || "—") + '</td>' +
        '<td>' + (a.registered ? '<span class="badge badge--good">uknjiženo</span>' : '<span class="badge badge--warn">проверить</span>') + '</td>' +
        '<td><a class="source-link" href="' + a.url + '" target="_blank" rel="noopener">' + escapeHtml(a.source) + ' ↗</a></td>' +
        '<td><button class="icon-button visited-btn ' + (state.visited ? "active" : "") + '" data-id="' + a.id + '" title="Посмотрели">✓</button></td>' +
        '</tr>';
    });
    $("#apartmentsTable tbody").html(html);
  }

  function renderMobileCards() {
    var html = "";
    filtered.forEach(function (a) {
      var state = getState(a.id);
      var image = firstImage(a);
      html += '<article class="apartment-card" data-id="' + a.id + '">' +
        (image ? '<img class="apartment-card__image gallery-open" data-id="' + a.id + '" src="' + escapeHtml(image) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
        '<div class="apartment-card__body">' +
          '<div class="apartment-card__top"><h3>' + escapeHtml(a.title) + '</h3>' +
            '<button class="icon-button favorite-btn ' + (state.favorite ? "active" : "") + '" data-id="' + a.id + '">★</button></div>' +
          '<div class="apartment-card__price">' + euro(a.price) + '</div>' +
          '<div class="apartment-card__meta">' + a.area + ' м² · ' + a.rooms + ' комн. · ' + euro(ppsqm(a)) + '/м² · ' + escapeHtml(a.floor || "") + '</div>' +
          '<div class="short-card__badges">' + badges(a) + '</div>' +
          '<div class="apartment-card__notes">' + escapeHtml(a.comment || "") + '</div>' +
          '<div class="apartment-card__actions">' +
            '<button class="btn btn--secondary map-focus" data-id="' + a.id + '">На карте</button>' +
            '<a class="btn" href="' + a.url + '" target="_blank" rel="noopener">' + escapeHtml(a.source) + ' ↗</a>' +
            '<button class="btn btn--secondary visited-btn" data-id="' + a.id + '">' + (state.visited ? "✓ смотрели" : "Не смотрели") + '</button>' +
          '</div>' +
        '</div></article>';
    });
    $("#mobileCards").html(html);
  }

  function renderAll() {
    renderShortlist();
    renderTable();
    renderMobileCards();
    ApartmentMap.render(filtered);
  }

  function openGallery(id) {
    var a = allApartments.find(function (x) { return x.id === id; });
    if (!a || !firstImage(a)) return;
    $("#galleryImage").attr("src", firstImage(a)).attr("alt", a.title);
    $("#galleryTitle").text(a.title + " — " + euro(a.price));
    $("#gallerySource").attr("href", a.url).text("Открыть " + a.source + " ↗");
    $("#galleryModal").addClass("open").attr("aria-hidden", "false");
  }

  function closeGallery() {
    $("#galleryModal").removeClass("open").attr("aria-hidden", "true");
  }

  function bindEvents() {
    $("#searchFilter, #districtFilter, #priceFilter, #areaFilter, #roomsFilter, #sourceFilter, #sortFilter")
      .on("input change", applyFilters);

    $(".chip").on("click", function () {
      quickMode = $(this).data("quick");
      $(".chip").removeClass("chip--active");
      $(this).addClass("chip--active");
      applyFilters();
    });

    $("#resetFilters").on("click", function () {
      $("#searchFilter").val("");
      $("#districtFilter, #priceFilter, #areaFilter, #roomsFilter, #sourceFilter").val("");
      $("#sortFilter").val("priority");
      quickMode = "all";
      $(".chip").removeClass("chip--active");
      $('.chip[data-quick="all"]').addClass("chip--active");
      applyFilters();
    });

    $(document).on("click", "tr[data-id], .short-card, .map-focus", function (event) {
      if ($(event.target).closest("a, button").length && !$(event.target).hasClass("map-focus")) return;
      var id = $(this).data("id") || $(this).closest("[data-id]").data("id");
      ApartmentMap.focus(id);
    });

    $(document).on("click", ".favorite-btn", function (event) {
      event.stopPropagation();
      var id = $(this).data("id");
      setState(id, "favorite", !getState(id).favorite);
    });

    $(document).on("click", ".visited-btn", function (event) {
      event.stopPropagation();
      var id = $(this).data("id");
      setState(id, "visited", !getState(id).visited);
    });

    $(document).on("click", ".gallery-open", function (event) {
      event.stopPropagation();
      openGallery($(this).data("id"));
    });

    $(".modal__close, .modal__backdrop").on("click", closeGallery);
    $(document).on("keydown", function (e) { if (e.key === "Escape") closeGallery(); });
  }

  function init() {
    ApartmentMap.init();
    $.getJSON("data/apartments.json")
      .done(function (data) {
        allApartments = data.apartments || [];
        fillSelects();
        renderStats();
        bindEvents();
        applyFilters();
      })
      .fail(function () {
        $("#shortlistCards").html('<p>Не удалось загрузить data/apartments.json. Если открываешь index.html напрямую с диска, запусти локальный HTTP-сервер или GitHub Pages.</p>');
      });
  }

  $(init);
})();
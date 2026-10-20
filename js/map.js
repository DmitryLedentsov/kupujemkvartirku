(function (global) {
  var map;
  var markers = {};
  var layer = L.layerGroup();

  function moneyShort(value) {
    if (!value) return "—";
    return "€" + Math.round(value / 1000) + "k";
  }

  function markerIcon(apartment) {
    var best = apartment.priority <= 2 ? " best" : "";
    return L.divIcon({
      className: "",
      html: '<div class="price-marker' + best + '">' + moneyShort(apartment.price) + '</div>',
      iconSize: [62, 30],
      iconAnchor: [31, 15]
    });
  }

  function fallbackImage(apartment) {
    return apartment.images && apartment.images.length ? apartment.images[0] : "";
  }

  function popupHtml(apartment) {
    var img = fallbackImage(apartment);
    var imageHtml = img ? '<img src="' + img + '" alt="" onerror="this.style.display=\'none\'">' : "";
    return '<div class="map-popup">' +
      imageHtml +
      '<h3>' + apartment.title + '</h3>' +
      '<div class="popup-price">€' + apartment.price.toLocaleString("ru-RU") + '</div>' +
      '<div class="popup-meta">' + apartment.area + ' м² · ' + apartment.rooms + ' комн. · €' +
      Math.round(apartment.price / apartment.area).toLocaleString("ru-RU") + '/м²</div>' +
      '<a href="' + apartment.url + '" target="_blank" rel="noopener">' + apartment.source + ' ↗</a>' +
      '</div>';
  }

  function init() {
    map = L.map("map", { zoomControl: true }).setView([44.817, 20.392], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    layer.addTo(map);
  }

  function render(apartments) {
    layer.clearLayers();
    markers = {};
    var bounds = [];

    apartments.forEach(function (apartment) {
      if (!apartment.location || !apartment.location.lat || !apartment.location.lng) return;
      var marker = L.marker([apartment.location.lat, apartment.location.lng], {
        icon: markerIcon(apartment)
      }).bindPopup(popupHtml(apartment), { maxWidth: 280 });

      marker.on("click", function () {
        $(document).trigger("apartment:selected", [apartment.id]);
      });

      marker.addTo(layer);
      markers[apartment.id] = marker;
      bounds.push([apartment.location.lat, apartment.location.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }

  function focus(id) {
    var marker = markers[id];
    if (!marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
    window.setTimeout(function () {
      var el = document.getElementById("map");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  global.ApartmentMap = {
    init: init,
    render: render,
    focus: focus
  };
})(window);
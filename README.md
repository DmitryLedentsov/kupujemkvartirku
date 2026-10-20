# kupujemkvartirku

Статический семейный каталог квартир в Белграде.

## Что внутри

- интерактивная карта Leaflet + OpenStreetMap;
- таблица и мобильные карточки;
- фильтры по району, цене, площади, комнатам и источнику;
- сортировка по цене / €/м² / площади;
- ссылки на оригинальные объявления;
- фотографии из объявлений, когда доступен стабильный URL;
- локальные отметки «фаворит» и «посмотрели» через localStorage;
- все объекты лежат отдельно в `data/apartments.json`.

## Структура

```
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── map.js
└── data/
    └── apartments.json
```

## Добавить квартиру

Добавьте новый объект в массив `apartments` файла `data/apartments.json`.

Минимально нужны:

```json
{
  "id": "unique-id",
  "title": "Blok 61 — улица",
  "district": "Novi Beograd",
  "neighborhood": "Blok 61",
  "address": "улица, Belgrade",
  "price": 175000,
  "area": 50,
  "rooms": 2.0,
  "source": "KupujemProdajem",
  "url": "https://...",
  "images": ["https://..."],
  "location": {
    "lat": 44.80,
    "lng": 20.38,
    "precision": "approximate"
  },
  "priority": 3
}
```

## Локальный запуск

Из корня проекта:

```bash
python -m http.server 8000
```

После этого открыть http://localhost:8000.

Прямое открытие `index.html` через `file://` не подходит, потому что браузер блокирует загрузку JSON через `fetch`.

## GitHub Pages

В репозитории: **Settings → Pages → Deploy from a branch → master / root**.

После этого сайт будет доступен по адресу:

`https://dmitryledentsov.github.io/kupujemkvartirku/`

## Важно

Координаты части объектов приблизительные: агентства нередко скрывают точный номер дома. Перед задатком отдельно проверять объявление, владельца, uknjiženost, зарегистрированную площадь, комиссию агентства и налоги.

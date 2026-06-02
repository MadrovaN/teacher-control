# teacher-control

Jednoduchá Node.js + Express aplikace pro anonymní hodnocení učitelů.

## Funkce
- 5-hvězdičkové hodnocení učitelů (pozitivní/negativní + vlastní text)
- Live chat „drbárna“ přes Socket.IO (včetně URL na školní memes)
- Evidence pozdních příchodů učitelů
- Denní hlasování Král/Královna dne (nominace + hlasování)
- Pololetní hlasování v kategoriích (1 hlas na uživatele v každé kategorii)
- Overall rating + žebříček
- Základní anonymita (lokální anonymní ID) a moderace chatu přes admin token

## Spuštění
```bash
npm install
npm start
```

Aplikace poběží na `http://localhost:3000`.

## Testy
```bash
npm test
```

## Moderace
Smazání zprávy z chatu:

```bash
curl -X DELETE http://localhost:3000/api/chat/1 -H "x-admin-token: teacher-admin"
```

Token lze změnit přes `ADMIN_TOKEN`.

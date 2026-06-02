poznatky: 
Nebude to tak složité na napsání ale spíše na vymyšlení, jak přesně to bude
bude potřeba vymyslet, jak to bude vypadat seznam učitelů a celý overall rating.
Nevím jestli to je uplně práce pro skoro 30 lidí ale nejspíš by se ho podařilo dokončit.
Tento projekt má asi největší šanci na nějaké dokončení a podle potřeby ho kdyžtak můžeme o nějaké funkce rozšířit.



# teacher-control

Jednoduchá Node.js + Express aplikace pro anonymní hodnocení učitelů.

## Funkce
- 5-hvězdičkové hodnocení učitelů (pozitivní/negativní + vlastní text)
- Zobrazení recenzí od ostatních uživatelů
- Live chat „drbárna“ přes Socket.IO (včetně URL na školní memes)
- Evidence pozdních příchodů učitelů
- Denní hlasování Král/Královna dne (nominace + hlasování)
- Pololetní hlasování ve statických kategoriích (1 hlas na uživatele v každé kategorii)
- Overall rating + žebříček
- Základní anonymita (lokální anonymní ID) a moderace chatu přes admin token
- Každá featura má vlastní stránku s navigací

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

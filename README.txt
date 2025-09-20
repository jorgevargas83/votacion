
PASOS RÁPIDOS (versión cero-errores, sin build, UMD):

1) En Supabase:
   - Crea un proyecto y copia URL + anon key.
   - Entra a SQL y ejecuta `schema.sql` (incluido).
   - Habilita Realtime para tablas: polls, votes.
   - (Demo) Las policies son abiertas; ciérralas luego si necesitas seguridad.

2) En los archivos:
   - Edita app.global.js y pon tu SUPABASE_URL y SUPABASE_ANON_KEY.
   - Sube todo a un hosting estático (Vercel, Netlify, GitHub Pages con 3rd-party CORS válido, etc.).

3) Flujo:
   - Abre index.html -> Admin -> Crea encuesta -> Muestra QR -> Copia link.
   - Vota en vote.html?poll=ID (código de juez debe estar en poll_judges).
   - Visualiza resultados en results.html?poll=ID (realtime).

Estructura:
- app.global.js  (UMD) → crea window.App con supabase y utilidades.
- admin.html/js  (UMD) → crea encuestas, asigna jueces, QR, abrir/cerrar, eliminar.
- vote.html/js   (UMD) → valida código, previene voto doble, inserta voto.
- results.html/js(UMD) → promedia jueces/público y muestra total ponderado en vivo.
- style.css      → estilos.
- schema.sql     → tablas, índices, RLS (abiertas para demo).

Listo.

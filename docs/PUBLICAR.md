# Publicar la variante A

Para enseñársela a colegas: pocas personas, de confianza, sin autenticación. **No es la
configuración para poner delante de estudiantes** — eso pide otras cosas y está al final.

## Un solo proceso

El servidor sirve el cliente compilado, así que publicar es un comando y no un montaje con
nginx delante. En desarrollo esto no cambia nada: Vite sigue sirviendo y haciendo de proxy.

```bash
npm --prefix app/web run build
```

```bash
source .venv/bin/activate && python -m uvicorn app.server.main:app --host 0.0.0.0 --port 8080
```

Eso ya sirve la lección completa en los dos idiomas, con el selector abajo a la derecha.
El cliente pesa **17,5 KB de JavaScript comprimido** más 3,3 de CSS; lo demás que descarga
un estudiante es el MP3 de la voz, 1,86 MB en español y 1,69 en inglés.

## Las tres cosas que hay que decidir antes, y no son técnicas

### 1. La clave del proveedor es tuya y el enlace no tiene puerta

Cualquiera que abra la dirección puede usar el chat del tutor, y eso gasta tu saldo. Hay
un **tope diario**, y por defecto son 5 dólares:

```bash
TUTORIA_LIMITE_USD_DIA=5
```

Al alcanzarlo, el chat responde una frase —*"El tutor no está disponible ahora mismo. La
lección sigue funcionando"*— y **la lección entera menos el chat sigue en pie**. Se degrada,
no se cae. El gasto del día se consulta en `/api/health`, que no expone la clave ni ningún
dato de nadie.

El tope corta el chat y **no** al juez. El chat es lo único que un desconocido dispara a
voluntad; el juez solo corre cuando alguien contesta un ítem abierto, y cortarlo dejaría de
recoger evidencia en silencio, que es peor que gastar unos centavos.

Poner `TUTORIA_LIMITE_USD_DIA=0` lo desactiva. No lo hagas en un enlace público.

### 2. El juez está en sombra y su compuerta se simuló

Corrige las respuestas abiertas, guarda su veredicto, y **al estudiante no se le enseña
nada de eso**. Es lo correcto: la compuerta de concordancia nunca se aprobó contra
etiquetas de Kristian, se simuló contra la intención de otro modelo. Ver `coord/HUMAN.md`
H-005.

Para enseñar el sistema a un colega, esto está bien y conviene decirlo en voz alta. Para
alumnos que crean que se les está evaluando, no.

### 3. Qué se guarda

Cada sesión escribe en SQLite: respuestas, eventos y los mensajes del chat. No hay
credenciales de nadie —el PoC usa un único estudiante local— pero **son textos que la gente
escribió**. Si el enlace circula, el archivo `.sqlite` acumula lo que hayan tecleado.
Decide dónde vive y quién lo ve.

## En contenedor (lo que sirve para cualquier host)

```bash
docker build -t tutoria .
```

```bash
docker run -p 8080:8080 -e OPENAI_API_KEY=... -v tutoria-datos:/data tutoria
```

211 MB de imagen. Dos etapas: node compila el cliente y desaparece, así que la imagen
final no lleva node_modules ni TypeScript. **La clave no va en la imagen**: se inyecta como
secreto del servicio.

Sin `OPENAI_API_KEY` arranca igual y todo funciona menos el chat del tutor — útil para
enseñarlo sin gastar nada.

### Por qué el MP3 de la lección ahora sí está en git

Estaba ignorado como "artefacto de compilación", y no lo es. La `timeline.json` que **sí**
está versionada contiene los segundos exactos de cada cue medidos contra ESE archivo de
audio; regenerarlo con TTS da otra duración y otros tiempos, así que el par audio+timeline
solo es coherente si viajan juntos. Además, sin él no se puede desplegar desde un git push:
el contenedor arrancaría mudo. Son 3,5 MB entre los dos idiomas.

## Cómo darle una dirección pública

Ninguna de estas la puedo hacer yo por ti: todas piden una cuenta tuya o abrir tu máquina.

- **Un túnel desde tu portátil** (`cloudflared tunnel --url http://localhost:8080`, o
  `ngrok http 8080`). Es lo más rápido y no hace falta desplegar nada. La contrapartida es
  que tu máquina tiene que estar encendida y el enlace muere cuando la cierras. Ninguno de
  los dos está instalado ahora mismo.
- **Hugging Face Spaces**, SDK Docker. Gratis, sin tarjeta, secreto para la clave, y sale
  en `kmlv-tutoria.hf.space`. Se duerme sin uso y despierta en unos segundos. Es el que
  mejor encaja con "que lo vean unos colegas".
- **Fly.io**. Franja gratuita pero pide tarjeta en el archivo. Más despierto y con volumen
  persistente para la base.
- **Render**, servicio web gratuito y sin tarjeta. Se apaga a los 15 minutos sin uso y el
  arranque en frío tarda cerca de un minuto.
- **Un VPS de la universidad**, si UCSC o PUCP te dan uno. Es la mejor opción a largo plazo
  y la única donde los datos no salen de una institución.

En todos: `OPENAI_API_KEY` y `TUTORIA_LIMITE_USD_DIA` como variables del servicio. **La
clave nunca en el repositorio.**

### Y la página de Quarto

`kmlv.github.io` es Jekyll y `ExperimentalEconomics` es Quarto: los dos estáticos, los dos
en GitHub Pages. Ninguno puede ejecutar esto. Lo que sí encaja es **enlazar** desde
`_teaching/2023-intermediate_microeconomics.md` a la dirección donde viva el tutor.

En los dos casos, el `.env` local no viaja: es solo para desarrollo y está en
`.gitignore`.

## Lo que faltaría para estudiantes de verdad

No está hecho, y es deliberado — enumerarlo es más honesto que dejarlo implícito:

- **Identidad por persona.** Hoy hay un único estudiante local, así que dos personas
  comparten historial y dominio. El esquema ya lo contempla (`external_auth_id`, decisión
  C15) y tutorIA nunca guarda contraseñas; falta conectarlo a algo.
- **Límite por persona**, no solo global. Con un tope diario compartido, el primero que
  llegue puede agotarlo para el resto.
- **Decir qué se guarda**, antes de que escriban.
- **La compuerta del juez de verdad**, si el veredicto va a mostrarse alguna vez.

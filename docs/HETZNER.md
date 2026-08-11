# Desplegar en el Hetzner

Probado entero en local antes de escribirlo: la pila levanta, los dos idiomas pasan el
recorrido completo del estudiante a través del proxy, la base sobrevive a reiniciar, y el
contenedor de la aplicación **no es accesible desde fuera** — solo Caddy escucha.

## Lo que hay que hacer, una vez

### 1. Un subdominio apuntando al servidor

Un registro `A` de, por ejemplo, `tutoria.tudominio.org` a la IP del Hetzner. Hace falta
**antes** de levantar nada, porque Let's Encrypt comprueba el dominio para emitir el
certificado.

Sin dominio también arranca —`DOMINIO=:80` y sirve por HTTP— pero entonces el navegador
marca la dirección como no segura, y eso es exactamente lo que no quieres en un enlace que
mandas por correo.

### 2. En el servidor

```bash
ssh root@<ip-del-hetzner>
```

Si no tiene Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

```bash
git clone https://github.com/kmlv/tutorIA.git && cd tutorIA && cp .env.ejemplo .env
```

### 3. Rellenar `.env`

```
OPENAI_API_KEY=sk-...
TUTORIA_LIMITE_USD_DIA=5
DOMINIO=tutoria.tudominio.org
```

**La clave se escribe aquí y en ningún otro sitio.** No va en el repositorio, ni en la
imagen, ni en un mensaje. `.env` está en `.gitignore`.

### 4. Levantar

```bash
docker compose up -d --build
```

La primera vez tarda un par de minutos: compila el cliente y baja las dependencias.
Después de eso, `docker compose logs -f` enseña si Caddy consiguió el certificado.

## Comprobar que quedó bien

```bash
curl -s https://tutoria.tudominio.org/api/health
```

Devuelve en qué modo está el juez y **cuánto llevas gastado hoy**. No devuelve la clave, ni
la imprime en los registros, ni la escribe en la base.

## El día a día

```bash
cd tutorIA && git pull && docker compose up -d --build
```

Eso actualiza. La base **no** se toca: vive en un volumen de Docker, no en el directorio
del repositorio, precisamente para que un `git clean` no se lleve por delante lo que hayan
escrito los estudiantes.

Para copiar la base y mirarla en local:

```bash
docker compose cp app:/data/tutoria.sqlite ./tutoria-$(date +%F).sqlite
```

## Lo que este despliegue SÍ resuelve

- **HTTPS automático**, renovado solo.
- **Tope de gasto diario.** Al alcanzarlo el chat responde una frase y la lección entera
  menos el chat sigue funcionando. Se degrada, no se cae.
- **La aplicación no está expuesta.** Solo Caddy escucha en 80 y 443; la app habla por la
  red interna. Si un día se te olvida el cortafuegos, no hay un uvicorn suelto en Internet.
- **Los datos se quedan en tu máquina.** Importa más aquí que en un sitio web normal: la
  aplicación guarda lo que la gente escribe en el chat.
- **Caché correcta.** El MP3 y el JavaScript se cachean una semana; la API **nunca**, para
  que una respuesta cacheada no le dé a un estudiante el veredicto de otro.

## Lo que NO resuelve, y conviene saberlo antes de mandar el enlace

- **No hay puerta.** Cualquiera con la dirección entra y puede usar el chat. Para colegas
  está bien; el tope de gasto es lo único que te protege el saldo.
- **Hay un solo estudiante.** El PoC usa un único identificador local, así que dos personas
  que entren a la vez comparten historial y estado de dominio. Se pisan.
- **El juez está en sombra y su compuerta se simuló.** Corrige las respuestas abiertas y
  guarda su veredicto, pero al estudiante no se le enseña nada de eso. Es lo correcto
  mientras no haya etiquetado real (ver `coord/HUMAN.md`, H-005).
- **No se avisa de qué se guarda.** Si el enlace va a circular más allá de un par de
  colegas, eso hay que decirlo antes de que escriban.

Los cuatro están en `docs/PUBLICAR.md` con más detalle, incluido qué haría falta para
ponerlo delante de estudiantes de verdad.

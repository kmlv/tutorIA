/**
 * Un solo MP3, y una ventana por lámina.
 *
 * Esto es lo que resolvió el debate y lo que más gente da por perdido al pasar a láminas:
 * NO se trocea la grabación. Las ventanas son contiguas —`hasta(N) === desde(N+1)`, medido
 * a 0,000 s en 11 de 11 uniones— así que reproducir la lección entera hacia adelante no
 * ejecuta ni una búsqueda. La voz sale exactamente igual que hoy, con su prosodia y sus
 * respiraciones intactas, y el corte entre láminas es un cambio de quién manda en la
 * pantalla, no un corte de audio.
 *
 * Buscar solo ocurre cuando el alumno salta, que es cuando debe ocurrir.
 *
 * La otra mitad: `timeupdate` dispara cada 250 ms más o menos, y esperar a que salte para
 * detenerse en el borde de una lámina de pregunta se pasaría hasta un cuarto de segundo
 * dentro de la siguiente. Aquí se sondea por fotograma, que es lo mismo que hace el motor
 * de cues de la aplicación actual.
 */
export type AlTerminar = (indice: number) => void;

export class VentanaAudio {
  private el: HTMLAudioElement;
  private ventana: { desde: number; hasta: number } | null = null;
  private indice = -1;
  private manejador: AlTerminar = () => {};
  private raf = 0;
  private alTick: Array<(t: number) => void> = [];

  constructor(src: string, host: HTMLElement = document.body) {
    this.el = document.createElement("audio");
    this.el.src = src;
    this.el.preload = "auto";
    // En el DOM y no un `new Audio()` suelto: así el sistema operativo lo reconoce como
    // medio de la página, y así un arnés puede instrumentarlo. Una prueba que no
    // encuentra el elemento no falla — pasa en vacío, que es peor.
    host.appendChild(this.el);
    const paso = (): void => {
      this.raf = requestAnimationFrame(paso);
      const t = this.el.currentTime;
      for (const f of this.alTick) f(t);
      const v = this.ventana;
      if (!v || this.el.paused) return;
      if (t >= v.hasta - 0.02) {
        // Se para EN el borde, y NO se ajusta el cabezal. Cuadrarlo a `v.hasta` sería un
        // salto hacia atrás de unos milisegundos —el sondeo llega siempre un poco tarde—
        // y un salto de milisegundos cuenta como salto: rompería la única propiedad que
        // este archivo defiende. Sobra, además: `situar` solo busca cuando el cabezal se
        // ha quedado FUERA de la ventana nueva, y unos milisegundos de más caen dentro.
        this.el.pause();
        this.ventana = null;
        this.manejador(this.indice);
      }
    };
    this.raf = requestAnimationFrame(paso);
  }

  onTerminar(f: AlTerminar): void {
    this.manejador = f;
  }

  onTick(f: (t: number) => void): void {
    this.alTick.push(f);
  }

  /**
   * Sitúa la ventana de una lámina. Solo busca si hace falta —si el cabezal ya está
   * dentro, lo deja donde está— y esa condición es la que mantiene continua la
   * reproducción hacia adelante.
   */
  situar(indice: number, desde: number, hasta: number): void {
    this.indice = indice;
    this.ventana = { desde, hasta };
    const t = this.el.currentTime;
    if (t < desde - 0.05 || t >= hasta) this.el.currentTime = desde;
  }

  reproducir(): Promise<void> {
    return this.el.play().catch(() => {
      // Sin gesto del usuario el navegador rechaza reproducir. No es un fallo: la lección
      // se queda quieta en la lámina y el botón sigue ahí.
    });
  }

  pausar(): void {
    this.el.pause();
  }

  get sonando(): boolean {
    return !this.el.paused;
  }

  get t(): number {
    return this.el.currentTime;
  }

  /** Rebobina dentro de la lámina actual, para "otra vez" sin cambiar de estado. */
  reiniciarVentana(): void {
    if (this.ventana) this.el.currentTime = this.ventana.desde;
  }

  destruir(): void {
    cancelAnimationFrame(this.raf);
    this.el.pause();
  }
}

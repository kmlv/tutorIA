# Corridas obsoletas

Estas corridas se hicieron contra la rúbrica de `q_slope_open` de TRES puntos, antes de
que Kristian fusionara `kp_tradeoff` y `kp_relative_price` en uno solo (2026-08-11).

Sus veredictos citan `kp_relative_price`, un id que ya no existe, así que `report.py` no
puede parearlas con el gold set actual. No se borran: son el registro de lo que ese
modelo dijo con esa rúbrica, y sirven para ver si la fusión cambió el acuerdo — pero eso
es una comparación entre rúbricas, no entre modelos, y hay que decirlo al citarla.

Para volver a medir: `evals/run_judge.py` contra la rúbrica de dos puntos.

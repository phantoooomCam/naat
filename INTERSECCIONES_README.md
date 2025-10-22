# 🎯 Detección de Intersecciones de Antenas - Documentación

## 📋 Descripción

Esta funcionalidad permite detectar y resaltar visualmente los sectores de antenas cuyos azimuths "se cruzan" dentro de una ventana de tiempo específica (1 hora).

## ✨ Características

- ✅ **Detección geométrica precisa**: Usa fórmulas de Haversine y bearings
- ✅ **Optimización espacial**: Grid indexing para evitar comparaciones O(N²)
- ✅ **Resaltado visual**: Sectores coincidentes en fucsia brillante
- ✅ **Estadísticas en tiempo real**: Total, coincidentes y pares detectados
- ✅ **Multi-sábana**: Analiza múltiples sábanas simultáneamente
- ✅ **No invasivo**: No afecta la funcionalidad existente

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/utils/geoUtils.js`**
   - Funciones geométricas para cálculos espaciales
   - Haversine, bearings, intersección de conos
   - Utilidades para puntos destino y grid espacial

2. **`src/assets/hooks/useIntersectingSectors.js`**
   - Hook personalizado para detección de intersecciones
   - Optimización con grid espacial
   - Retorna IDs destacados, pares y estadísticas

3. **`src/componentes/EjemploIntersecciones.jsx`**
   - Ejemplos completos de uso
   - Interfaz con selector de modo
   - Documentación integrada

### Archivos Modificados

1. **`src/componentes/MapAntenas.jsx`**
   - Nuevos props: `intersectionMode`, `intersectionHour`
   - Estados para gestión de intersecciones
   - useEffect para carga de sectores horarios
   - Lógica de resaltado en polígonos
   - Leyenda actualizada con estadísticas

2. **`src/componentes/MapAntenas.css`**
   - Estilos para sectores destacados
   - Animación de pulso para intersecciones

## 📖 Uso

### Modo Normal (sin cambios)

```jsx
<MapAntenas 
  idSabana={123}
  fromDate="2025-10-01"
  toDate="2025-10-31"
/>
```

### Modo Intersección - Una sábana

```jsx
<MapAntenas 
  idSabana={123}
  fromDate="2025-10-01"
  toDate="2025-10-31"
  intersectionMode={true}
  intersectionHour="2025-10-22T14:00:00"
/>
```

### Modo Intersección - Múltiples sábanas

```jsx
<MapAntenas 
  idSabana={[123, 456, 789]}
  fromDate="2025-10-01"
  toDate="2025-10-31"
  intersectionMode={true}
  intersectionHour="2025-10-22T10:00:00"
/>
```

## 🎛️ Props

### Nuevos Props (Opcionales)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `intersectionMode` | `boolean` | `false` | Activa el modo de detección de intersecciones |
| `intersectionHour` | `string \| Date` | `null` | Hora específica para analizar (formato ISO o Date object) |

### Props Existentes (sin cambios)

Todos los props anteriores siguen funcionando exactamente igual.

## ⚙️ Criterios de Detección

### Condiciones para considerar "intersección"

1. **Distancia**: ≤ 600 metros entre sitios
2. **Ángulo A→B**: `|azimuth_A - bearing(A→B)| ≤ 5°`
3. **Ángulo B→A**: `|azimuth_B - bearing(B→A)| ≤ 5°`
4. **Ambos deben cumplir**: Sector A apunta hacia B Y sector B apunta hacia A

### Parámetros configurables

En el componente MapAntenas.jsx, línea ~77:

```javascript
const { highlightedIds, pairs, stats } = useIntersectingSectors(
  intersectionMode ? intersectionSectors : [],
  600, // <-- Distancia máxima en metros
  5    // <-- Mitad del ángulo del cono en grados
);
```

## 🎨 Visualización

### Sectores Normales
- Color: Color de la sábana
- Opacidad de relleno: 0.2
- Opacidad de borde: 0.6
- Grosor: 1px

### Sectores Coincidentes
- Color: **#ff00ff** (fucsia brillante)
- Opacidad de relleno: 0.4
- Opacidad de borde: 1.0
- Grosor: **3px**
- z-Index: 10000 + rank (siempre al frente)
- Efecto: Sombra y animación de pulso

## 📊 Estadísticas Mostradas

La leyenda muestra:
- **Total**: Cantidad total de sectores analizados
- **Coinciden**: Cantidad de sectores que forman parte de intersecciones
- **Pares**: Número de pares de sectores detectados

Ejemplo: Si sectores A, B y C forman 2 pares (A-B, B-C):
- Total: 100
- Coinciden: 3 (A, B, C)
- Pares: 2

## 🔧 Funcionamiento Interno

### 1. Carga de Datos

Cuando `intersectionMode=true`:

```javascript
// Convierte la hora local a UTC (ventana de 1 hora)
const fromLocal = new Date(intersectionHour);
fromLocal.setMinutes(0, 0, 0);
const toLocal = new Date(fromLocal);
toLocal.setHours(toLocal.getHours() + 1);

// Request al endpoint
POST /api/sabanas/registros/batch/sectors/summary
{
  "sabanas": [{ "id": 123 }],
  "from": "2025-10-22T14:00:00Z",
  "to": "2025-10-22T15:00:00Z",
  "tz": "America/Mexico_City",
  "topN": 500,
  "minFreq": 1,
  "perSabana": false
}
```

### 2. Detección de Intersecciones

El hook `useIntersectingSectors` realiza:

1. **Indexación espacial**: Divide el espacio en celdas ~1.1km
2. **Comparación optimizada**: Solo compara sectores en celdas adyacentes (3x3)
3. **Verificación geométrica**: 
   - Calcula distancia con Haversine
   - Calcula bearings entre puntos
   - Verifica ángulos con los azimuths

### 3. Renderizado

```javascript
// En sectorPolygons useMemo
const isHighlighted = highlightedIds.has(sector.sectorId);
const sectorColor = isHighlighted ? "#ff00ff" : baseColor;

// En Polygon options
strokeWeight: poly.isHighlighted ? 3 : 1,
zIndex: poly.isHighlighted ? 10000 + poly.rank : poly.rank,
```

## 🚀 Rendimiento

### Optimizaciones Implementadas

1. **Grid espacial**: Reduce comparaciones de O(N²) a O(N×k) donde k≈27
2. **Memoización**: `useMemo` previene recálculos innecesarios
3. **Límite de datos**: `topN: 500` en el request
4. **Carga separada**: No interfiere con la carga normal de sitios
5. **Abort controllers**: Cancela requests obsoletos

### Métricas Esperadas

- **500 sectores**: ~50-100ms de procesamiento
- **1000 sectores**: ~200-400ms de procesamiento
- **Memoria**: ~2-5MB adicionales para 500 sectores

## 🐛 Manejo de Errores

### Estados de Error

- `intersectionError`: Errores durante carga de sectores
- `loadingIntersections`: Indica carga en progreso
- Mensajes de error visibles en overlay

### Ejemplo de Manejo

```jsx
{intersectionMode && intersectionError && (
  <div className="map-overlay-status">
    <div className="mapa-antenas-status error">
      {intersectionError}
    </div>
  </div>
)}
```

## 📝 Notas Técnicas

### Conversión de Horarios

- La hora recibida se asume en hora **local**
- Se convierte automáticamente a **UTC** para el endpoint
- La ventana es siempre de **1 hora exacta** (To es exclusivo)

### Compatibilidad

- ✅ React 18+
- ✅ Google Maps API con librería "geometry"
- ✅ PropTypes para validación
- ✅ Compatible con modo de rutas existente

### Limitaciones Conocidas

- Máximo 500 sectores por sábana (configurable)
- Ventana fija de 1 hora (no configurable desde props)
- Solo analiza sectores, no sitios sin sectores

## 🔮 Mejoras Futuras Posibles

- [ ] Líneas conectando pares coincidentes
- [ ] Exportar reporte de coincidencias (CSV/JSON)
- [ ] Ventana horaria configurable
- [ ] Filtros adicionales (por frecuencia, operador)
- [ ] Heatmap de densidad de intersecciones
- [ ] Alertas automáticas de intersecciones críticas
- [ ] Historial de intersecciones por hora del día

## 💡 Ejemplos Avanzados

### Con Selector de Hora Dinámico

Ver archivo: `src/componentes/EjemploIntersecciones.jsx`

### Análisis Programático

```javascript
import { useIntersectingSectors } from './assets/hooks/useIntersectingSectors';

function MiAnalisis({ sectores }) {
  const { highlightedIds, pairs, stats } = useIntersectingSectors(
    sectores,
    600, // distancia
    5    // ángulo
  );

  console.log(`Encontradas ${pairs.length} intersecciones`);
  console.log(`${stats.intersecting} sectores involucrados`);
  
  pairs.forEach(([a, b]) => {
    console.log(`Intersección: Sector ${a.sectorId} ↔ ${b.sectorId}`);
  });

  return <div>...</div>;
}
```

## 📞 Soporte

Para dudas o problemas:
1. Verifica la consola del navegador
2. Revisa el tab Network para errores de API
3. Confirma que Google Maps carga correctamente
4. Verifica que `intersectionHour` esté en formato válido

---

**Última actualización**: Octubre 22, 2025  
**Versión**: 1.0.0  
**Autor**: GitHub Copilot

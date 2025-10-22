import { useMemo } from 'react';
import { conesIntersect, buildGridKey } from '../../utils/geoUtils';

/**
 * Hook que detecta sectores con conos que se intersectan
 * @param {Array} sectors - Lista de sectores con {sectorId, lat, lng, azimuth}
 * @param {number} maxDist - Distancia máxima en metros (default: 600)
 * @param {number} halfCone - Mitad del ángulo del cono (default: 5)
 */
export function useIntersectingSectors(sectors, maxDist = 600, halfCone = 5) {
  return useMemo(() => {
    if (!sectors || sectors.length === 0) {
      return { highlightedIds: new Set(), pairs: [], stats: { total: 0, intersecting: 0, pairsCount: 0 } };
    }

    // 1. Indexar sectores por celdas espaciales (grid)
    const grid = new Map();
    for (const sector of sectors) {
      const key = buildGridKey(sector.lat, sector.lng);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key).push(sector);
    }

    // 2. Detectar intersecciones comparando solo sectores en celdas adyacentes
    const highlighted = new Set();
    const pairs = [];
    const keys = Array.from(grid.keys());

    for (const key of keys) {
      const [iy, ix] = key.split(':').map(Number);
      
      // Recolectar sectores de celdas vecinas (3x3)
      const bucket = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const neighborKey = `${iy + dy}:${ix + dx}`;
          const neighborSectors = grid.get(neighborKey);
          if (neighborSectors) {
            bucket.push(...neighborSectors);
          }
        }
      }

      // Comparar sectores de la celda actual con los vecinos
      const currentSectors = grid.get(key);
      for (const sectorA of currentSectors) {
        for (const sectorB of bucket) {
          // Evitar duplicados y auto-comparación
          if (sectorA.sectorId >= sectorB.sectorId) continue;

          const intersects = conesIntersect(
            { lat: sectorA.lat, lng: sectorA.lng, az: sectorA.azimuth },
            { lat: sectorB.lat, lng: sectorB.lng, az: sectorB.azimuth },
            maxDist,
            halfCone
          );

          if (intersects) {
            highlighted.add(sectorA.sectorId);
            highlighted.add(sectorB.sectorId);
            pairs.push([sectorA, sectorB]);
          }
        }
      }
    }

    return {
      highlightedIds: highlighted,
      pairs,
      stats: {
        total: sectors.length,
        intersecting: highlighted.size,
        pairsCount: pairs.length,
      },
    };
  }, [sectors, maxDist, halfCone]);
}

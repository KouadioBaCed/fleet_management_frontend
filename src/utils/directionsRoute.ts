// Calcul d'itineraire routier pour la carte de suivi web.
//
// Objectif : afficher exactement le meme trace que l'application mobile
// (cf. mobile-app/src/screens/ActiveMissionScreen.tsx) — une voie qui suit
// les VRAIES routes, et non une simple ligne droite. On reproduit la meme
// cascade de repli pour qu'un itineraire soit TOUJOURS disponible :
//   1) Google Directions (via le SDK JS deja charge — pas de souci CORS)
//      -> route + trafic, necessite la facturation Google activee
//   2) OSRM (gratuit, sans cle, CORS autorise) -> route suivant les rues
//   3) Ligne directe origine -> (checkpoints) -> destination (dernier recours)

export interface LatLng {
  lat: number;
  lng: number;
}

// Decode une polyline encodee Google/OSRM (precision 5) en points {lat, lng}.
// Algorithme identique a celui du mobile (decodePolyline).
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// --- 1) Google Directions via le SDK JS deja charge (pas de CORS) ---
async function fetchGoogleDirections(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[]
): Promise<LatLng[] | null> {
  if (typeof google === 'undefined' || !google.maps?.DirectionsService) return null;
  try {
    const service = new google.maps.DirectionsService();
    const result = await service.route({
      origin,
      destination,
      waypoints: waypoints.map((p) => ({ location: p, stopover: false })),
      travelMode: google.maps.TravelMode.DRIVING,
    });
    const path = result.routes?.[0]?.overview_path;
    if (path && path.length > 1) {
      return path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    }
    return null;
  } catch {
    // REQUEST_DENIED (facturation desactivee), ZERO_RESULTS, etc. -> on replie sur OSRM
    return null;
  }
}

// --- 2) OSRM (gratuit, suit les rues, CORS autorise) ---
async function fetchOsrmRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[]
): Promise<LatLng[] | null> {
  try {
    // OSRM attend lng,lat ; waypoints intermediaires separes par ';'
    const coordStr = [origin, ...waypoints, destination]
      .map((p) => `${p.lng},${p.lat}`)
      .join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=polyline`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.length > 0) {
      // OSRM 'polyline' = encodage precision 5, identique a Google -> meme decodeur.
      return decodePolyline(data.routes[0].geometry);
    }
    return null;
  } catch {
    return null;
  }
}

// Itineraire routier avec repli en cascade. Retourne toujours au moins une
// ligne directe entre les points, jamais un tableau vide.
export async function fetchRoadRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[] = []
): Promise<LatLng[]> {
  return (
    (await fetchGoogleDirections(origin, destination, waypoints)) ||
    (await fetchOsrmRoute(origin, destination, waypoints)) ||
    [origin, ...waypoints, destination]
  );
}

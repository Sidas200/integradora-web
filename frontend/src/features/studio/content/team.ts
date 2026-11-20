import arturo from '@/assets/art/team-arturo.webp'
import emmanuel from '@/assets/art/team-emmanuel.webp'
import omar from '@/assets/art/team-omar.webp'
import regina from '@/assets/art/team-regina.webp'
import santiago from '@/assets/art/team-santiago.webp'
import yahir from '@/assets/art/team-yahir.webp'

/**
 * The people of Hex Studio. Edit this list to add someone or change a role. `area` picks the color
 * of the tile behind the sprite; `scrum` is the person's Scrum role, if any.
 */
export interface TeamMember {
  name: string
  role: string
  sprite: string
  area: 'game' | 'art' | 'web' | 'mobile' | 'api'
  scrum?: 'Product Owner' | 'Scrum Master'
}

export const TEAM: readonly TeamMember[] = [
  { name: 'Regina', role: 'Desarrollo web', sprite: regina, area: 'web', scrum: 'Product Owner' },
  { name: 'Arturo', role: 'Desarrollo de la app móvil', sprite: arturo, area: 'mobile', scrum: 'Scrum Master' },
  { name: 'Emmanuel', role: 'Desarrollo del videojuego y de la API', sprite: emmanuel, area: 'api' },
  { name: 'Yahir', role: 'Desarrollo del videojuego', sprite: yahir, area: 'game' },
  { name: 'Omar', role: 'Arte y desarrollo del videojuego', sprite: omar, area: 'art' },
  { name: 'Santiago', role: 'Arte y desarrollo del videojuego', sprite: santiago, area: 'art' },
]

import { COMPANY } from '../company'

/** A block of a legal document: a paragraph, a bullet list or a table. */
export type LegalBlock = string | { list: readonly string[] } | { table: { head: readonly string[]; rows: readonly (readonly string[])[] } }

export interface LegalSection {
  id: string
  title: string
  blocks: readonly LegalBlock[]
}

export interface LegalDocument {
  title: string
  intro: string
  sections: readonly LegalSection[]
}

/**
 * Aviso de privacidad integral (Ley Federal de Protección de Datos Personales en Posesión de los
 * Particulares, DOF 20-03-2025): covers the six elements of article 15 and the transfer clause of
 * article 35. Describes exactly what the game, this site and the mobile app store
 * (see docs/db/V1__initial_schema.sql).
 */
export const PRIVACY: LegalDocument = {
  title: 'Aviso de privacidad',
  intro: `${COMPANY.legalName} («${COMPANY.name}») pone a tu disposición este aviso de privacidad integral, en cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (la «Ley»). Aplica al juego The Day I Made That Promise, a este sitio y a la app móvil.`,
  sections: [
    {
      id: 'responsable',
      title: '1. Identidad y domicilio del responsable',
      blocks: [
        `${COMPANY.legalName}, con domicilio en ${COMPANY.address}, es responsable del tratamiento de tus datos personales.`,
        `Nuestro ${COMPANY.privacyOfficer} atiende cualquier tema relacionado con tus datos en ${COMPANY.privacyEmail}.`,
      ],
    },
    {
      id: 'datos',
      title: '2. Datos personales que tratamos',
      blocks: [
        {
          table: {
            head: ['Cuándo', 'Datos'],
            rows: [
              ['Al crear tu cuenta', 'Correo electrónico, nombre de usuario y contraseña (guardamos solo una huella cifrada, nunca la contraseña), y la fecha en que aceptaste este aviso.'],
              ['Al jugar con tu cuenta', 'Partidas guardadas, inventario, progreso de la historia, logros, configuración del juego, sesiones de juego y eventos de juego (por ejemplo, enemigos derrotados, objetos fabricados o hitos cumplidos).'],
              ['Al iniciar sesión', 'Tipo de cliente (web, juego para PC o app móvil), navegador o dispositivo, y fechas de inicio y último uso de cada sesión.'],
              ['Al suscribirte al aviso de lanzamiento', 'Correo electrónico, idioma preferido y fecha de tu consentimiento.'],
            ],
          },
        },
        'Datos sensibles: no recabamos ni tratamos datos personales sensibles. Tampoco pedimos datos financieros ni patrimoniales.',
      ],
    },
    {
      id: 'finalidades',
      title: '3. Finalidades del tratamiento',
      blocks: [
        'Finalidades necesarias. Son indispensables para darte el servicio que solicitas, por lo que no requieren un consentimiento distinto al de aceptar este aviso:',
        {
          list: [
            'Crear y administrar tu cuenta de jugador e identificarte cuando inicias sesión.',
            'Guardar tu progreso y sincronizar partidas, logros e historial entre el juego, este sitio y la app móvil.',
            'Proteger tu cuenta: mostrarte los dispositivos con sesión abierta, permitirte cerrarlas y detectar usos indebidos.',
            'Enviarte el aviso de lanzamiento si te suscribiste.',
          ],
        },
        'Finalidad adicional. No es necesaria para el servicio y requiere tu consentimiento:',
        { list: ['Analizar de forma agregada cómo se juega (por ejemplo, en qué zona se pierde más) para mejorar la dificultad y el diseño del juego.'] },
        `Si no quieres que usemos tus datos para la finalidad adicional, escríbenos a ${COMPANY.privacyEmail} con el asunto «Finalidad adicional». Negarte no afecta tu cuenta ni tu partida.`,
      ],
    },
    {
      id: 'encargados',
      title: '4. Encargados y transferencias',
      blocks: [
        'No vendemos ni rentamos tus datos. Para operar el servicio usamos proveedores (encargados) que los tratan solo por nuestra cuenta y bajo nuestras instrucciones:',
        {
          list: [
            'Supabase: base de datos donde se guardan tu cuenta y tu progreso (servidores en Canadá).',
            'Render: servidor de la API que usan el juego, este sitio y la app móvil.',
            'Vercel: alojamiento de este sitio.',
            'GitHub: descarga del juego y de la app móvil.',
          ],
        },
        'Algunos de estos proveedores están fuera de México. Estas comunicaciones son remisiones a encargados y no transferencias, por lo que no requieren tu consentimiento.',
        'Transferencias: no transferimos tus datos personales a terceros. Solo los comunicaríamos sin tu consentimiento en los casos que permite la Ley, por ejemplo, ante el requerimiento de una autoridad competente. Si en el futuro quisiéramos transferirlos, te pediríamos antes tu consentimiento.',
      ],
    },
    {
      id: 'limitar',
      title: '5. Cómo limitar el uso o divulgación de tus datos',
      blocks: [
        {
          list: [
            'Desde Mi cuenta puedes cambiar tu nombre de usuario, cerrar sesiones abiertas en otros dispositivos y eliminar tu cuenta.',
            `Para dejar de recibir el aviso de lanzamiento o negarte a la finalidad adicional, escríbenos a ${COMPANY.privacyEmail} desde el correo que registraste.`,
            'En tu navegador puedes borrar los datos que guarda este sitio (consulta la Política de cookies).',
          ],
        },
      ],
    },
    {
      id: 'derechos',
      title: '6. Derechos ARCO y revocación del consentimiento',
      blocks: [
        'Tienes derecho a acceder a tus datos, rectificarlos si son inexactos, cancelarlos u oponerte a su tratamiento (derechos ARCO), así como a revocar el consentimiento que nos diste.',
        'Para ejercerlos, envía una solicitud a ' + COMPANY.privacyEmail + ' que incluya:',
        {
          list: [
            'Tu nombre y el correo o nombre de usuario de tu cuenta, para responderte.',
            'Una identificación que acredite que eres titular de la cuenta o, en su caso, la representación legal de quien lo solicita.',
            'La descripción clara del derecho que quieres ejercer y de los datos a los que se refiere.',
            'En caso de rectificación, el dato correcto.',
          ],
        },
        'Responderemos a tu correo en los plazos que establece la Ley y, si la solicitud procede, la haremos efectiva en los plazos que la misma Ley señala. Si eliminas tu cuenta desde Mi cuenta, la cancelación es inmediata: se borran tu perfil, partidas, logros e historial.',
        'Si consideras que tu derecho a la protección de datos fue vulnerado, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno, autoridad en la materia.',
      ],
    },
    {
      id: 'conservacion',
      title: '7. Conservación y seguridad',
      blocks: [
        'Conservamos los datos de tu cuenta mientras esté activa. Las sesiones vencen solas a los 30 días sin uso. Al eliminar tu cuenta borramos tus datos, salvo los que debamos conservar por obligación legal.',
        'Protegemos tus datos con conexiones cifradas, contraseñas guardadas como huella cifrada y acceso a la base de datos limitado a la API.',
      ],
    },
    {
      id: 'tecnologias',
      title: '8. Cookies y almacenamiento en tu navegador',
      blocks: ['Este sitio usa una cookie necesaria para mantener tu sesión y guarda datos en tu navegador para funcionar sin conexión. No usamos cookies de publicidad ni de análisis. Los detalles están en la Política de cookies.'],
    },
    {
      id: 'menores',
      title: '9. Menores de edad',
      blocks: ['Si eres menor de edad, crea tu cuenta con el permiso y la supervisión de tu madre, padre o tutor.'],
    },
    {
      id: 'cambios',
      title: '10. Cambios a este aviso',
      blocks: [`Cualquier cambio a este aviso se publicará en esta página con su nueva fecha de actualización. Si el cambio afecta las finalidades o los datos que tratamos, además te lo comunicaremos al correo de tu cuenta.`],
    },
  ],
}

/** Política de cookies: everything the site keeps in the browser (cookie, localStorage, IndexedDB, cache). */
export const COOKIES: LegalDocument = {
  title: 'Política de cookies',
  intro: `Esta política explica qué guarda en tu navegador el sitio de The Day I Made That Promise, de ${COMPANY.legalName}. Solo usamos lo necesario para que funcionen tu sesión, tus preferencias y el modo sin conexión: no hay cookies de publicidad, de análisis ni de terceros, por eso no te mostramos un aviso para aceptarlas.`,
  sections: [
    {
      id: 'cookies',
      title: '1. Cookies',
      blocks: [
        {
          table: {
            head: ['Nombre', 'Para qué sirve', 'Tipo', 'Duración'],
            rows: [
              ['tdimp_rt', 'Mantiene tu sesión iniciada de forma segura. Tu navegador la envía solo a la API de inicio de sesión y ningún código de la página puede leerla.', 'Necesaria', '30 días o hasta que cierres sesión'],
            ],
          },
        },
      ],
    },
    {
      id: 'almacenamiento',
      title: '2. Otros datos guardados en tu navegador',
      blocks: [
        {
          table: {
            head: ['Dónde', 'Qué guarda', 'Para qué', 'Cuándo se borra'],
            rows: [
              ['Almacenamiento local: tdimp.theme', 'Tu elección de tema (claro, oscuro o el del sistema).', 'Recordar cómo prefieres ver la página.', 'Cuando borras los datos del sitio.'],
              ['Almacenamiento local: tdimp.offline-session', 'Tu identificador, nombre de usuario y correo, sin contraseñas ni tokens.', 'Mostrar tu cuenta en modo de solo lectura cuando no hay conexión.', 'Al cerrar sesión.'],
              ['IndexedDB: tdimp', 'Una copia de tus partidas, logros e historial.', 'Consultarlos sin conexión.', 'Al cerrar sesión o al entrar con otra cuenta.'],
              ['Caché de la aplicación', 'Los archivos de la página, las imágenes y las noticias públicas.', 'Cargar más rápido y funcionar sin conexión.', 'Cuando se publica una versión nueva o borras los datos del sitio.'],
            ],
          },
        },
      ],
    },
    {
      id: 'control',
      title: '3. Cómo controlarlas',
      blocks: [
        'Puedes borrar las cookies y los datos del sitio desde la configuración de tu navegador. Si bloqueas la cookie de sesión no podrás iniciar sesión, pero podrás seguir viendo las páginas públicas.',
      ],
    },
    {
      id: 'contacto',
      title: '4. Contacto',
      blocks: [`Si tienes dudas sobre esta política, escríbenos a ${COMPANY.privacyEmail}. Para saber cómo tratamos tus datos personales, consulta el Aviso de privacidad.`],
    },
  ],
}

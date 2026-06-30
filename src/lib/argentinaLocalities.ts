export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Ciudad de Buenos Aires",
  "Córdoba",
  "Entre Ríos",
  "Mendoza",
  "Neuquén",
] as const;

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number];

const LOCALITIES: Record<string, string[]> = {
  "Buenos Aires": [
    "Adrogué","Avellaneda","Bahía Blanca","Banfield","Berazategui","Bernal Oeste",
    "Campana","Canning","Castelar","Escobar","Florencio Varela","General Pacheco",
    "Haedo","Hurlingham","Ituzaingó","La Plata","Lanús","Lanús Oeste","Lomas de Zamora",
    "Longchamps","Mar del Plata","Martínez","Merlo","Moreno","Morón","Olavarría",
    "Olivos","Padua","Pilar","Quilmes","Quilmes Oeste","Ramos Mejía",
    "Remedios de Escalada","San Fernando","San Isidro","San Justo","San Martín",
    "San Miguel","Tigre","Vicente López","Villa Adelina","Wilde",
  ],
  "Chubut": ["Comodoro Rivadavia", "Esquel"],
  "Ciudad Autónoma de Buenos Aires": [
    "Almagro","Balvanera","Barracas","Belgrano","Boedo","Caballito","Chacarita",
    "Colegiales","Flores","Floresta","Liniers","Mataderos","Microcentro","Monserrat",
    "Nuñez","Palermo","Parque Avellaneda","Parque Chacabuco","Parque Chas","Recoleta",
    "Retiro","Saavedra","San Cristóbal","San Nicolás","San Telmo","Villa Crespo",
    "Villa del Parque","Villa Devoto","Villa Luro","Villa Ortúzar","Villa Pueyrredón",
    "Villa Santa Rita","Villa Urquiza",
  ],
  "Córdoba": [
    "Alta Gracia","Barrio General Paz","Córdoba Capital","Córdoba Centro","Cosquín",
    "Mina Clavero","Parque Tablada","Río Cuarto","Villa de las Rosas",
  ],
  "Entre Ríos": ["Chajarí","Colón","Concepción del Uruguay","Concordia","Paraná"],
  "Mendoza": ["Godoy Cruz","Mendoza Capital"],
  "Neuquén": ["Neuquén Capital"],
};

// "Ciudad de Buenos Aires" comparte localidades con CABA
LOCALITIES["Ciudad de Buenos Aires"] = LOCALITIES["Ciudad Autónoma de Buenos Aires"];

export function getLocalities(province: string): string[] {
  return LOCALITIES[province] ?? [];
}

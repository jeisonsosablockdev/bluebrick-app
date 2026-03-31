export type Division = {
  code: string;
  name: string;
};

export type CountryInfo = {
  code: string;
  nameEn: string;
  nameEs: string;
  namePt: string;
  dialCode: string;
  divisions?: Division[];
  divisionLabel?: { en: string; es: string; pt: string };
};

export const COUNTRIES: CountryInfo[] = [
  {
    code: "US",
    nameEn: "United States",
    nameEs: "Estados Unidos",
    namePt: "Estados Unidos",
    dialCode: "+1",
    divisionLabel: { en: "State", es: "Estado", pt: "Estado" },
    divisions: [
      { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
      { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
      { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
      { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
      { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
      { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
      { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
      { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
      { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
      { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
      { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
      { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
      { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
      { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
      { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
      { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
      { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
    ]
  },
  {
    code: "CA",
    nameEn: "Canada",
    nameEs: "Canadá",
    namePt: "Canadá",
    dialCode: "+1",
    divisionLabel: { en: "Province/Territory", es: "Provincia/Territorio", pt: "Província/Território" },
    divisions: [
      { code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" }, { code: "MB", name: "Manitoba" },
      { code: "NB", name: "New Brunswick" }, { code: "NL", name: "Newfoundland and Labrador" },
      { code: "NS", name: "Nova Scotia" }, { code: "ON", name: "Ontario" }, { code: "PE", name: "Prince Edward Island" },
      { code: "QC", name: "Quebec" }, { code: "SK", name: "Saskatchewan" }, { code: "NT", name: "Northwest Territories" },
      { code: "NU", name: "Nunavut" }, { code: "YT", name: "Yukon" }
    ]
  },
  {
    code: "MX",
    nameEn: "Mexico",
    nameEs: "México",
    namePt: "México",
    dialCode: "+52",
    divisionLabel: { en: "State", es: "Estado", pt: "Estado" },
    divisions: [
      { code: "AGU", name: "Aguascalientes" }, { code: "BCN", name: "Baja California" }, { code: "BCS", name: "Baja California Sur" },
      { code: "CAM", name: "Campeche" }, { code: "CHS", name: "Chiapas" }, { code: "CHI", name: "Chihuahua" },
      { code: "CMX", name: "Ciudad de México" }, { code: "COA", name: "Coahuila" }, { code: "COL", name: "Colima" },
      { code: "DUR", name: "Durango" }, { code: "GTO", name: "Guanajuato" }, { code: "GRO", name: "Guerrero" },
      { code: "HID", name: "Hidalgo" }, { code: "JAL", name: "Jalisco" }, { code: "MEX", name: "Estado de México" },
      { code: "MIC", name: "Michoacán" }, { code: "MOR", name: "Morelos" }, { code: "NAY", name: "Nayarit" },
      { code: "NLE", name: "Nuevo León" }, { code: "OAX", name: "Oaxaca" }, { code: "PUE", name: "Puebla" },
      { code: "QUE", name: "Querétaro" }, { code: "ROO", name: "Quintana Roo" }, { code: "SLP", name: "San Luis Potosí" },
      { code: "SIN", name: "Sinaloa" }, { code: "SON", name: "Sonora" }, { code: "TAB", name: "Tabasco" },
      { code: "TAM", name: "Tamaulipas" }, { code: "TLA", name: "Tlaxcala" }, { code: "VER", name: "Veracruz" },
      { code: "YUC", name: "Yucatán" }, { code: "ZAC", name: "Zacatecas" }
    ]
  },
  {
    code: "BR",
    nameEn: "Brazil",
    nameEs: "Brasil",
    namePt: "Brasil",
    dialCode: "+55",
    divisionLabel: { en: "State", es: "Estado", pt: "Estado" },
    divisions: [
      { code: "AC", name: "Acre" }, { code: "AL", name: "Alagoas" }, { code: "AP", name: "Amapá" }, { code: "AM", name: "Amazonas" },
      { code: "BA", name: "Bahia" }, { code: "CE", name: "Ceará" }, { code: "DF", name: "Distrito Federal" }, { code: "ES", name: "Espírito Santo" },
      { code: "GO", name: "Goiás" }, { code: "MA", name: "Maranhão" }, { code: "MT", name: "Mato Grosso" }, { code: "MS", name: "Mato Grosso do Sul" },
      { code: "MG", name: "Minas Gerais" }, { code: "PA", name: "Pará" }, { code: "PB", name: "Paraíba" }, { code: "PR", name: "Paraná" },
      { code: "PE", name: "Pernambuco" }, { code: "PI", name: "Piauí" }, { code: "RJ", name: "Rio de Janeiro" }, { code: "RN", name: "Rio Grande do Norte" },
      { code: "RS", name: "Rio Grande do Sul" }, { code: "RO", name: "Rondônia" }, { code: "RR", name: "Roraima" }, { code: "SC", name: "Santa Catarina" },
      { code: "SP", name: "São Paulo" }, { code: "SE", name: "Sergipe" }, { code: "TO", name: "Tocantins" }
    ]
  },
  {
    code: "CO",
    nameEn: "Colombia",
    nameEs: "Colombia",
    namePt: "Colômbia",
    dialCode: "+57",
    divisionLabel: { en: "Department", es: "Departamento", pt: "Departamento" },
    divisions: [
      { code: "AMA", name: "Amazonas" }, { code: "ANT", name: "Antioquia" }, { code: "ARA", name: "Arauca" },
      { code: "ATL", name: "Atlántico" }, { code: "DC", name: "Bogotá D.C." }, { code: "BOL", name: "Bolívar" },
      { code: "BOY", name: "Boyacá" }, { code: "CAL", name: "Caldas" }, { code: "CAQ", name: "Caquetá" },
      { code: "CAS", name: "Casanare" }, { code: "CAU", name: "Cauca" }, { code: "CES", name: "Cesar" },
      { code: "CHO", name: "Chocó" }, { code: "COR", name: "Córdoba" }, { code: "CUN", name: "Cundinamarca" },
      { code: "GUA", name: "Guainía" }, { code: "GUV", name: "Guaviare" }, { code: "HUI", name: "Huila" },
      { code: "LAG", name: "La Guajira" }, { code: "MAG", name: "Magdalena" }, { code: "MET", name: "Meta" },
      { code: "NAR", name: "Nariño" }, { code: "NSA", name: "Norte de Santander" }, { code: "PUT", name: "Putumayo" },
      { code: "QUI", name: "Quindío" }, { code: "RIS", name: "Risaralda" }, { code: "SAP", name: "San Andrés y Providencia" },
      { code: "SAN", name: "Santander" }, { code: "SUC", name: "Sucre" }, { code: "TOL", name: "Tolima" },
      { code: "VAC", name: "Valle del Cauca" }, { code: "VAU", name: "Vaupés" }, { code: "VID", name: "Vichada" }
    ]
  },
  { code: "AR", nameEn: "Argentina", nameEs: "Argentina", namePt: "Argentina", dialCode: "+54" },
  { code: "CL", nameEn: "Chile", nameEs: "Chile", namePt: "Chile", dialCode: "+56" },
  { code: "PE", nameEn: "Peru", nameEs: "Perú", namePt: "Peru", dialCode: "+51" },
  { code: "ES", nameEn: "Spain", nameEs: "España", namePt: "Espanha", dialCode: "+34" },
  { code: "PT", nameEn: "Portugal", nameEs: "Portugal", namePt: "Portugal", dialCode: "+351" },
  { code: "GB", nameEn: "United Kingdom", nameEs: "Reino Unido", namePt: "Reino Unido", dialCode: "+44" },
  { code: "DE", nameEn: "Germany", nameEs: "Alemania", namePt: "Alemanha", dialCode: "+49" },
  { code: "FR", nameEn: "France", nameEs: "Francia", namePt: "França", dialCode: "+33" },
  { code: "IT", nameEn: "Italy", nameEs: "Italia", namePt: "Itália", dialCode: "+39" },
  { code: "CH", nameEn: "Switzerland", nameEs: "Suiza", namePt: "Suíça", dialCode: "+41" },
  { code: "AU", nameEn: "Australia", nameEs: "Australia", namePt: "Austrália", dialCode: "+61" },
  { code: "JP", nameEn: "Japan", nameEs: "Japón", namePt: "Japão", dialCode: "+81" }
];

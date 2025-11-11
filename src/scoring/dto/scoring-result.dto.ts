export class ScoringResultDto {
  id: string;
  nombre: string;
  puntaje: number;
  detalle: {
    formacion: number;
    experiencia: number;
    habilidades: number;
    competencias: number;
    palabrasClave: number;
  };
}

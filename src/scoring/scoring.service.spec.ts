import { ScoringService } from './scoring.service';

describe('ScoringService - calcularCandidatoScore', () => {
  const service = new ScoringService({} as any);
  const baseConfig = {
    formacionPeso: 0.2,
    experienciaPeso: 0.3,
    habilidadesPeso: 0.25,
    competenciasPeso: 0.15,
    palabrasClavePeso: 0.1,
  };

  it('normaliza valores y produce un total 0-100', () => {
    const candidato = {
      id: '1',
      nombre: 'Demo',
      formacion: 90,
      anosExperiencia: 8,
      habilidades: 80,
      competencias: 70,
      palabrasClave: 60,
    };

    const result = service.calcularCandidatoScore(candidato, baseConfig);

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.detalle.formacion).toBeCloseTo(18); // 0.9 * 0.2 * 100
  });

  it('usa cero cuando faltan datos', () => {
    const candidato = {
      id: '2',
      nombre: 'Sin datos',
      formacion: undefined,
      anosExperiencia: undefined,
      habilidades: undefined,
      competencias: undefined,
      palabrasClave: undefined,
    } as any;

    const result = service.calcularCandidatoScore(candidato, baseConfig);
    expect(result.total).toBe(0);
  });

  it('limita la experiencia al máximo establecido', () => {
    const candidato = {
      id: '3',
      nombre: 'Senior',
      formacion: 50,
      anosExperiencia: 20,
      habilidades: 50,
      competencias: 50,
      palabrasClave: 50,
    };

    const result = service.calcularCandidatoScore(candidato, baseConfig);
    expect(result.detalle.experiencia).toBe(30); // 1 * 0.3 * 100
  });
});

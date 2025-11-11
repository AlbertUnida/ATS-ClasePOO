import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringResultDto } from './dto/scoring-result.dto';

interface ScoringConfigWeights {
  formacionPeso: number;
  experienciaPeso: number;
  habilidadesPeso: number;
  competenciasPeso: number;
  palabrasClavePeso: number;
}

interface CandidateData {
  id: string;
  nombre: string;
  formacion: number;
  anosExperiencia: number;
  habilidades: number;
  competencias: number;
  palabrasClave: number;
}

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el top N de candidatos ordenados por puntaje descendente.
   * @param tenantSlug identifica al tenant sobre el que se calculará el ranking
   * @param top cantidad de candidatos a devolver (ej. 10)
   */
  async obtenerTopCandidatos(
    tenantSlug: string,
    top = 10,
  ): Promise<ScoringResultDto[]> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
    });
    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    const config =
      (await this.prisma.scoringConfig.findUnique({ where: { tenantId: tenant.id } })) ??
      (await this.prisma.scoringConfig.create({ data: { tenantId: tenant.id } }));

    const candidatos = await this.prisma.candidatos.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
    });

    const resultados = await Promise.all(
      candidatos.map(async (registro) => {
        const candidato = this.mapearCandidato(registro);
        const puntaje = this.calcularCandidatoScore(candidato, config);

        await this.prisma.candidatoScore.upsert({
          where: { candidatoId: candidato.id },
          update: { puntajeTotal: puntaje.total, detalleJson: puntaje.detalle },
          create: {
            candidatoId: candidato.id,
            puntajeTotal: puntaje.total,
            detalleJson: puntaje.detalle,
          },
        });

        return {
          id: candidato.id,
          nombre: candidato.nombre,
          puntaje: puntaje.total,
          detalle: puntaje.detalle,
        };
      }),
    );

    return resultados
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, top);
  }

  /**
   * Función central que calcula el puntaje normalizado de un candidato.
   * Todos los valores se normalizan a 0-1 y luego se ponderan según la
   * configuración almacenada para RRHH.
   */
  calcularCandidatoScore(
    candidato: CandidateData,
    pesos: ScoringConfigWeights,
  ): { total: number; detalle: ScoringResultDto['detalle'] } {
    const pesosNormalizados = this.normalizarPesos(pesos);

    const formacion = this.normalizar(candidato.formacion);
    const experiencia = this.normalizarExperiencia(candidato.anosExperiencia);
    const habilidades = this.normalizar(candidato.habilidades);
    const competencias = this.normalizar(candidato.competencias);
    const palabras = this.normalizar(candidato.palabrasClave);

    const aportes = {
      formacion: formacion * pesosNormalizados.formacionPeso * 100,
      experiencia: experiencia * pesosNormalizados.experienciaPeso * 100,
      habilidades: habilidades * pesosNormalizados.habilidadesPeso * 100,
      competencias: competencias * pesosNormalizados.competenciasPeso * 100,
      palabrasClave: palabras * pesosNormalizados.palabrasClavePeso * 100,
    };

    const total = Object.values(aportes).reduce((acc, value) => acc + value, 0);

    return {
      total: Number(total.toFixed(2)),
      detalle: {
        formacion: Number(aportes.formacion.toFixed(2)),
        experiencia: Number(aportes.experiencia.toFixed(2)),
        habilidades: Number(aportes.habilidades.toFixed(2)),
        competencias: Number(aportes.competencias.toFixed(2)),
        palabrasClave: Number(aportes.palabrasClave.toFixed(2)),
      },
    };
  }

  private mapearCandidato(registro: any): CandidateData {
    const perfil = this.parsePerfil(registro.perfilJson);
    const experiencia =
      perfil?.anosExperiencia ??
      perfil?.experiencia?.anios ??
      perfil?.experiencia ??
      0;

    return {
      id: registro.id,
      nombre: registro.nombre,
      formacion: perfil?.formacionScore ?? perfil?.formacion ?? 0,
      anosExperiencia: experiencia,
      habilidades: perfil?.habilidadesMatch ?? perfil?.habilidades ?? 0,
      competencias: perfil?.competenciasMatch ?? perfil?.competencias ?? 0,
      palabrasClave: perfil?.palabrasClaveMatch ?? perfil?.palabrasClave ?? 0,
    };
  }

  private parsePerfil(perfilJson?: string | null) {
    if (!perfilJson) return undefined;
    try {
      return typeof perfilJson === 'string' ? JSON.parse(perfilJson) : perfilJson;
    } catch {
      return undefined;
    }
  }

  private normalizar(valor?: number) {
    if (!valor || valor <= 0) return 0;
    return Math.min(valor, 100) / 100;
  }

  private normalizarExperiencia(anos?: number, referencia = 10) {
    if (!anos || anos <= 0) return 0;
    return Math.min(anos / referencia, 1);
  }

  /**
   * Si un administrador cambia los pesos y no suman 1, los normalizamos
   * para mantener el puntaje final entre 0-100.
   */
  private normalizarPesos(pesos: ScoringConfigWeights) {
    const total =
      pesos.formacionPeso +
      pesos.experienciaPeso +
      pesos.habilidadesPeso +
      pesos.competenciasPeso +
      pesos.palabrasClavePeso;

    if (total === 0) {
      return {
        formacionPeso: 0.2,
        experienciaPeso: 0.3,
        habilidadesPeso: 0.25,
        competenciasPeso: 0.15,
        palabrasClavePeso: 0.1,
      };
    }

    const factor = 1 / total;
    return {
      formacionPeso: pesos.formacionPeso * factor,
      experienciaPeso: pesos.experienciaPeso * factor,
      habilidadesPeso: pesos.habilidadesPeso * factor,
      competenciasPeso: pesos.competenciasPeso * factor,
      palabrasClavePeso: pesos.palabrasClavePeso * factor,
    };
  }
}
